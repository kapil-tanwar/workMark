import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import User from "../models/User.js";
import { validateBulkRecord, normalizeEmail, normalizePhone } from "./employeeValidation.js";

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_ROWS = 1000;
const MAX_UNCOMPRESSED_XLSX_BYTES = 60 * 1024 * 1024;

/** Canonical columns, in template order. `key` is the internal field name. */
export const TEMPLATE_COLUMNS = [
  { key: "name", header: "Name", required: true, example: ["Aarav Sharma", "Priya Nair"], note: "Full name, up to 120 characters" },
  { key: "employeeId", header: "Employee ID", required: true, example: ["EMP-2001", "EMP-2002"], note: "2–32 characters, unique. Stored in upper case" },
  { key: "phone", header: "Phone", required: true, example: ["+91 98765 43210", "+91 98765 43211"], note: "7–20 characters, digits with optional + ( ) - . and spaces, unique" },
  { key: "email", header: "Email", required: false, example: ["aarav.sharma@company.com", ""], note: "Optional. Valid email format, unique" },
  { key: "department", header: "Department", required: false, example: ["Engineering", "Design"], note: "Optional, up to 120 characters" },
  { key: "designation", header: "Designation", required: false, example: ["Software Engineer", "Product Designer"], note: "Optional, up to 120 characters" },
  { key: "earnedLeaves", header: "Earned Leaves", required: false, example: ["", "12"], note: "Optional number 0–365. Blank = this month's accrual" },
  { key: "compOffLeaves", header: "Comp-Off Leaves", required: false, example: ["", "2"], note: "Optional number 0–365. Blank = 0" },
];

/** Header aliases → internal field. Keys are lower-cased with non-alphanumerics removed. */
const HEADER_ALIASES = {
  name: "name", fullname: "name", employeename: "name",
  employeeid: "employeeId", empid: "employeeId", employeeno: "employeeId", employeecode: "employeeId", id: "employeeId",
  phone: "phone", phonenumber: "phone", mobile: "phone", mobilenumber: "phone", contactnumber: "phone",
  email: "email", emailaddress: "email", mail: "email",
  department: "department", dept: "department",
  designation: "designation", jobtitle: "designation", title: "designation", position: "designation",
  earnedleaves: "earnedLeaves", earnedleave: "earnedLeaves", earned: "earnedLeaves",
  compoffleaves: "compOffLeaves", compoffleave: "compOffLeaves", compoff: "compOffLeaves",
  role: "role",
};

const REQUIRED_FIELDS = TEMPLATE_COLUMNS.filter((c) => c.required).map((c) => c.key);

export class ImportError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ───────────────────────── file sniffing ───────────────────────── */

export function detectFormat(fileName = "") {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".xlsx")) return "xlsx";
  if (lower.endsWith(".csv")) return "csv";
  throw new ImportError("Only .csv and .xlsx files are supported");
}

/** Verify the bytes actually look like the claimed format (extension alone proves nothing). */
function assertContentMatches(buffer, format) {
  if (!buffer?.length) throw new ImportError("The uploaded file is empty");
  if (format === "xlsx") {
    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) throw new ImportError("File content does not match the .xlsx format");
    assertZipNotBomb(buffer);
    return;
  }
  const head = buffer.subarray(0, 8192);
  if (head.includes(0)) throw new ImportError("File content does not look like a CSV text file");
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw new ImportError("CSV must be UTF-8 encoded");
  }
}

/** Reject .xlsx archives that would expand to an unreasonable size in memory. */
function assertZipNotBomb(buf) {
  const min = Math.max(0, buf.length - 65557);
  let eocd = -1;
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new ImportError("The .xlsx file is corrupted");
  const entries = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  let total = 0;
  for (let i = 0; i < entries; i++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) {
      throw new ImportError("The .xlsx file is corrupted");
    }
    total += buf.readUInt32LE(offset + 24);
    if (total > MAX_UNCOMPRESSED_XLSX_BYTES) throw new ImportError("The spreadsheet expands to an unreasonable size");
    offset += 46 + buf.readUInt16LE(offset + 28) + buf.readUInt16LE(offset + 30) + buf.readUInt16LE(offset + 32);
  }
}

/* ───────────────────────── parsing ───────────────────────── */

function cellText(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text).join("").trim();
    if ("result" in v) return cellText(v.result); // formula: use cached value, never evaluate
    if ("text" in v) return cellText(v.text); // hyperlink
    if ("error" in v) return "";
    return "";
  }
  return String(v).trim();
}

function normalizeHeader(h) {
  return cellText(h).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Parse a CSV/XLSX buffer into raw records.
 * Returns { rows: [{ rowNumber, raw }], unknownColumns }.
 * rowNumber matches what the admin sees in Excel (header = row 1).
 */
export async function parseEmployeeFile(buffer, fileName) {
  const format = detectFormat(fileName);
  assertContentMatches(buffer, format);

  const workbook = new ExcelJS.Workbook();
  let sheet;
  try {
    if (format === "xlsx") {
      await workbook.xlsx.load(buffer);
      sheet = workbook.worksheets[0];
    } else {
      let text = buffer;
      if (text[0] === 0xef && text[1] === 0xbb && text[2] === 0xbf) text = text.subarray(3); // strip BOM
      // `map` keeps every value a string so "007" and "+91…" survive untouched.
      sheet = await workbook.csv.read(Readable.from(text), { map: (v) => v });
    }
  } catch (err) {
    console.error("[import] parse failure:", err.message);
    throw new ImportError(`Could not read the ${format.toUpperCase()} file. Make sure it is not corrupted or password-protected.`);
  }
  if (!sheet) throw new ImportError("The file has no worksheet");

  // Locate the header row (first non-empty row).
  let headerRowNumber = 0;
  sheet.eachRow({ includeEmpty: false }, (row, n) => {
    if (!headerRowNumber) headerRowNumber = n;
  });
  if (!headerRowNumber) throw new ImportError("The file contains no data");

  const columnToField = new Map();
  const unknownColumns = [];
  const seenFields = new Set();
  sheet.getRow(headerRowNumber).eachCell({ includeEmpty: false }, (cell, col) => {
    const label = cellText(cell.value);
    const field = HEADER_ALIASES[normalizeHeader(cell.value)];
    if (field && !seenFields.has(field)) {
      columnToField.set(col, field);
      seenFields.add(field);
    } else if (label) {
      unknownColumns.push(label);
    }
  });

  const missing = REQUIRED_FIELDS.filter((f) => !seenFields.has(f));
  if (missing.length) {
    const labels = missing.map((f) => TEMPLATE_COLUMNS.find((c) => c.key === f).header);
    throw new ImportError(`Missing required column${labels.length > 1 ? "s" : ""}: ${labels.join(", ")}. Download the template to see the expected format.`);
  }

  const rows = [];
  for (let n = headerRowNumber + 1; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n);
    const raw = {};
    let hasValue = false;
    for (const [col, field] of columnToField) {
      const text = cellText(row.getCell(col).value);
      raw[field] = text;
      if (text) hasValue = true;
    }
    if (!hasValue) continue; // skip fully blank rows
    rows.push({ rowNumber: n, raw });
    if (rows.length > MAX_ROWS) {
      throw new ImportError(`Too many rows. A single import is limited to ${MAX_ROWS} employees — split the file and import in batches.`, 413);
    }
  }
  if (!rows.length) throw new ImportError("The file has a header but no employee rows");

  return { rows, unknownColumns };
}

/* ───────────────────────── analysis ───────────────────────── */

/**
 * Validate every row, then detect duplicates inside the file and against the
 * database. Each row ends up as exactly one of:
 *   valid      – safe to import
 *   invalid    – failed field validation
 *   duplicate  – clashes on email / employee ID / phone with another row or an existing account
 */
export async function analyzeRows(parsedRows) {
  const results = parsedRows.map(({ rowNumber, raw }) => {
    const v = validateBulkRecord(raw);
    return {
      rowNumber,
      status: v.errors ? "invalid" : "valid",
      errors: v.errors || [],
      data: v.data || null,
      display: {
        name: raw.name || "",
        email: raw.email || "",
        employeeId: raw.employeeId || "",
        phone: raw.phone || "",
        department: raw.department || "",
        designation: raw.designation || "",
        earnedLeaves: raw.earnedLeaves || "",
        compOffLeaves: raw.compOffLeaves || "",
      },
    };
  });

  const candidates = results.filter((r) => r.status === "valid");

  // 1. Duplicates inside the file: first occurrence wins, later ones are flagged.
  const firstSeen = { email: new Map(), employeeId: new Map(), phone: new Map() };
  for (const r of candidates) {
    const keys = [
      ["employeeId", r.data.employeeId, "Employee ID"],
      ["email", r.data.email, "Email"],
      ["phone", r.data.phone, "Phone"],
    ];
    for (const [field, value, label] of keys) {
      if (!value) continue;
      const prior = firstSeen[field].get(value);
      if (prior !== undefined) {
        r.errors.push(`${label} duplicates row ${prior} in this file`);
      } else {
        firstSeen[field].set(value, r.rowNumber);
      }
    }
    if (r.errors.length) r.status = "duplicate";
  }

  // 2. Duplicates against existing accounts (global: unique indexes are global).
  const stillValid = candidates.filter((r) => r.status === "valid");
  const emails = [...new Set(stillValid.map((r) => r.data.email).filter(Boolean))];
  const ids = [...new Set(stillValid.map((r) => r.data.employeeId))];
  const phones = [...new Set(stillValid.map((r) => r.data.phone))];
  if (stillValid.length) {
    const existing = await User.find({
      $or: [
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        { employeeId: { $in: ids } },
        { phone: { $in: phones } },
      ],
    })
      .select("email employeeId phone")
      .lean();
    const takenEmail = new Set(existing.map((u) => u.email).filter(Boolean));
    const takenId = new Set(existing.map((u) => u.employeeId).filter(Boolean));
    const takenPhone = new Set(existing.map((u) => u.phone).filter(Boolean));
    for (const r of stillValid) {
      if (takenId.has(r.data.employeeId)) r.errors.push(`Employee ID ${r.data.employeeId} already exists`);
      if (r.data.email && takenEmail.has(r.data.email)) r.errors.push(`Email ${r.data.email} already exists`);
      if (takenPhone.has(r.data.phone)) r.errors.push("Phone number is already in use");
      if (r.errors.length) r.status = "duplicate";
    }
  }

  return results;
}

export function summarize(results) {
  const count = (s) => results.filter((r) => r.status === s).length;
  return {
    total: results.length,
    valid: count("valid"),
    invalid: count("invalid"),
    duplicates: count("duplicate"),
  };
}

/** Map a Mongo duplicate-key message to a friendly reason (covers import races). */
export function describeDuplicateKey(message = "") {
  if (/employeeId/i.test(message)) return "Employee ID already exists";
  if (/email/i.test(message)) return "Email already exists";
  if (/phone/i.test(message)) return "Phone number is already in use";
  return "Duplicate record";
}

/* ───────────────────────── template ───────────────────────── */

export async function buildTemplateXlsx() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "WorkMark";
  const ws = wb.addWorksheet("Employees");
  ws.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: Math.max(16, c.header.length + 6) }));
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0C8F6B" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const i of [0, 1]) {
    ws.addRow(Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c.key, c.example[i]])));
  }
  // Identifier-like columns are text so Excel never strips leading zeros or "+".
  for (const key of ["employeeId", "phone"]) ws.getColumn(key).numFmt = "@";

  const info = wb.addWorksheet("Instructions");
  info.columns = [
    { header: "Column", key: "c", width: 20 },
    { header: "Required", key: "r", width: 10 },
    { header: "Rules", key: "n", width: 80 },
  ];
  info.getRow(1).font = { bold: true };
  for (const c of TEMPLATE_COLUMNS) info.addRow({ c: c.header, r: c.required ? "Yes" : "No", n: c.note });
  info.addRow({});
  info.addRow({ c: "Notes", n: `Up to ${MAX_ROWS} rows and 2 MB per file. Passwords are never uploaded — each employee receives a secure invitation link to set their own. All imported accounts are employees.` });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function buildTemplateCsv() {
  const lines = [
    TEMPLATE_COLUMNS.map((c) => c.header).join(","),
    ...[0, 1].map((i) => TEMPLATE_COLUMNS.map((c) => csvCell(c.example[i])).join(",")),
  ];
  return lines.join("\r\n") + "\r\n";
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export { normalizeEmail, normalizePhone };
