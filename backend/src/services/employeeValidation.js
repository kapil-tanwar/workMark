import { z } from "zod";

/**
 * Single source of truth for employee field rules.
 * Used by POST /api/employees (individual) and the bulk importer so both
 * paths enforce exactly the same business rules.
 */

export function normalizeEmployeeId(id) {
  return String(id || "").trim().toUpperCase();
}

export function normalizeEmail(email) {
  const trimmed = String(email || "").trim().toLowerCase();
  return trimmed || undefined;
}

export function normalizePhone(phone) {
  return String(phone || "").trim();
}

/** Field rules shared by individual creation (kept identical to the original schema). */
export const employeeBaseShape = {
  name: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  employeeId: z.string().min(2).max(32),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().min(7).max(20),
  earnedLeaves: z.number().optional(),
  compOffLeaves: z.number().optional(),
};

/* ── Bulk-import row rules (superset of the base rules) ── */

// Values that spreadsheet apps interpret as formulas. Never allow them to be
// persisted, otherwise a later CSV/XLSX export could execute them.
const FORMULA_START = /^[=+\-@\t\r]/;

const optionalText = (label, max = 120) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .refine((v) => !v || !FORMULA_START.test(v), `${label} must not start with =, +, - or @`)
    .optional();

const optionalLeaveDays = (label) =>
  z
    .number({ invalid_type_error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(365, `${label} cannot exceed 365`)
    .optional();

export const bulkRowSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be at most 120 characters")
    .refine((v) => !FORMULA_START.test(v), "Name must not start with =, +, - or @"),
  email: z
    .string()
    .trim()
    .max(254, "Email is too long")
    .email("Email format is invalid")
    .optional(),
  employeeId: z
    .string({ required_error: "Employee ID is required" })
    .min(2, "Employee ID must be 2–32 characters")
    .max(32, "Employee ID must be 2–32 characters")
    .refine((v) => /^[A-Z0-9][A-Z0-9._\/-]*$/.test(v), "Employee ID may only contain letters, digits and . _ - /"),
  phone: z
    .string({ required_error: "Phone is required" })
    .trim()
    .min(7, "Phone must be 7–20 characters")
    .max(20, "Phone must be 7–20 characters")
    .regex(/^[+0-9][0-9 ()\-.]*$/, "Phone may only contain digits, spaces and + ( ) - ."),
  department: optionalText("Department"),
  designation: optionalText("Designation"),
  earnedLeaves: optionalLeaveDays("Earned leaves"),
  compOffLeaves: optionalLeaveDays("Comp-off leaves"),
});

/**
 * Validate one raw spreadsheet record (all values are strings or undefined).
 * Returns { data } on success or { errors: string[] } listing EVERY problem.
 * `role` is never part of the output: imported accounts are always employees.
 */
export function validateBulkRecord(raw) {
  const errors = [];

  const role = String(raw.role ?? "").trim().toLowerCase();
  if (role && role !== "employee") {
    errors.push(`Role "${raw.role}" is not allowed — imported accounts are always employees`);
  }

  const candidate = {
    name: raw.name ?? "",
    email: emptyToUndefined(raw.email)?.toLowerCase(),
    employeeId: normalizeEmployeeId(raw.employeeId),
    phone: normalizePhone(raw.phone),
    department: emptyToUndefined(raw.department),
    designation: emptyToUndefined(raw.designation),
    earnedLeaves: toNumber(raw.earnedLeaves),
    compOffLeaves: toNumber(raw.compOffLeaves),
  };

  const parsed = bulkRowSchema.safeParse(candidate);
  if (!parsed.success) {
    const seen = new Set();
    for (const issue of parsed.error.issues) {
      if (!seen.has(issue.message)) {
        seen.add(issue.message);
        errors.push(issue.message);
      }
    }
  }

  if (errors.length) return { errors };
  return { data: parsed.data };
}

function emptyToUndefined(v) {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
}

function toNumber(v) {
  const s = String(v ?? "").trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

