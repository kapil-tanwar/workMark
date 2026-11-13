import { Router } from "express";
import multer from "multer";
import User from "../models/User.js";
import { authRequired, adminOnly, isDemoUser } from "../middleware/auth.js";
import { getMonthlyAccrualAmount } from "../utils/earnedAccrual.js";
import { logAudit } from "../services/audit.js";
import { buildInviteUrl, createInviteToken, unusablePasswordHash } from "../services/invitation.js";
import {
  MAX_FILE_BYTES,
  MAX_ROWS,
  TEMPLATE_COLUMNS,
  ImportError,
  analyzeRows,
  buildTemplateCsv,
  buildTemplateXlsx,
  describeDuplicateKey,
  detectFormat,
  parseEmployeeFile,
  summarize,
} from "../services/employeeImport.js";

/**
 * Mounted at /api/employees/bulk-import (before the generic /api/employees router
 * so "bulk-import" is never mistaken for an :id).
 * Every route below requires a valid JWT AND the admin role.
 */
const router = Router();
router.use(authRequired, adminOnly);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 5, parts: 8 },
  fileFilter: (_req, file, cb) => {
    try {
      detectFormat(file.originalname);
      cb(null, true);
    } catch (e) {
      cb(e);
    }
  },
});

function uploadSingle(req, _res, next) {
  upload.single("file")(req, _res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next({ status: 413, message: `File is too large. The maximum size is ${MAX_FILE_BYTES / 1024 / 1024} MB.` });
    }
    if (err instanceof multer.MulterError) return next({ status: 400, message: "Upload failed: " + err.message });
    return next({ status: err.status || 400, message: err.message || "Upload failed" });
  });
}

function requireFile(req, _res, next) {
  if (!req.file) return next({ status: 400, message: 'No file uploaded. Send a .csv or .xlsx file in the "file" field.' });
  next();
}

function publicRow(r) {
  return { rowNumber: r.rowNumber, status: r.status, errors: r.errors, data: r.display };
}

function handleKnownErrors(next) {
  return (err) => (err instanceof ImportError ? next({ status: err.status, message: err.message }) : next(err));
}

/* ── GET /template?format=xlsx|csv ── */
router.get("/template", async (req, res, next) => {
  try {
    const format = req.query.format === "csv" ? "csv" : "xlsx";
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="workmark-employee-import-template.csv"');
      return res.send(buildTemplateCsv());
    }
    const buf = await buildTemplateXlsx();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="workmark-employee-import-template.xlsx"');
    res.send(buf);
  } catch (e) {
    next(e);
  }
});

/* ── GET /spec — columns & limits for the UI ── */
router.get("/spec", (_req, res) => {
  res.json({
    maxFileBytes: MAX_FILE_BYTES,
    maxRows: MAX_ROWS,
    columns: TEMPLATE_COLUMNS.map(({ header, required, note, example }) => ({ header, required, note, example: example[0] })),
  });
});

/* ── POST /preview — parse + validate only, writes nothing ── */
router.post("/preview", uploadSingle, requireFile, async (req, res, next) => {
  try {
    const { rows, unknownColumns } = await parseEmployeeFile(req.file.buffer, req.file.originalname);
    const results = await analyzeRows(rows);
    res.json({
      fileName: req.file.originalname,
      unknownColumns,
      summary: summarize(results),
      rows: results.map(publicRow),
    });
  } catch (e) {
    handleKnownErrors(next)(e);
  }
});

/* ── POST / — re-validates the file server-side, then imports the valid rows ── */
router.post("/", uploadSingle, requireFile, async (req, res, next) => {
  try {
    const { rows } = await parseEmployeeFile(req.file.buffer, req.file.originalname);
    const results = await analyzeRows(rows); // never trust a previous preview
    const toImport = results.filter((r) => r.status === "valid");

    const isDummy = isDemoUser(req.user); // same isolation rule as single-employee creation
    const monthlyAccrual = toImport.length ? await getMonthlyAccrualAmount() : 0;
    const now = new Date();
    const accrualDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);

    // Build documents + one-time invitation tokens.
    const prepared = [];
    for (const r of toImport) {
      const invite = createInviteToken();
      const d = r.data;
      const earnedGiven = d.earnedLeaves !== undefined;
      prepared.push({
        result: r,
        invite,
        doc: {
          name: d.name,
          ...(d.email ? { email: d.email } : {}),
          employeeId: d.employeeId,
          phone: d.phone,
          ...(d.department ? { department: d.department } : {}),
          ...(d.designation ? { designation: d.designation } : {}),
          role: "employee", // hard-coded: spreadsheets can never grant admin rights
          active: true,
          approvalStatus: "approved",
          isDummy,
          passwordHash: await unusablePasswordHash(),
          invitePending: true,
          inviteTokenHash: invite.tokenHash,
          inviteExpiresAt: invite.expiresAt,
          leaveBalances: {
            earnedTotal: earnedGiven ? d.earnedLeaves : monthlyAccrual,
            compOffTotal: d.compOffLeaves ?? 0,
            lastEarnedAccrualAt: earnedGiven ? now : accrualDate,
          },
        },
      });
    }

    // Unordered bulkWrite: one bad/raced row never aborts the rest.
    const writeFailures = new Map(); // index -> { status, reason }
    if (prepared.length) {
      try {
        await User.bulkWrite(
          prepared.map((p) => ({ insertOne: { document: p.doc } })),
          { ordered: false },
        );
      } catch (err) {
        const writeErrors = err?.writeErrors ?? err?.result?.getWriteErrors?.();
        if (!writeErrors?.length) throw err; // not a per-row failure (e.g. connection lost)
        for (const we of [].concat(writeErrors)) {
          const index = we.index ?? we.err?.index;
          const code = we.code ?? we.err?.code;
          const msg = we.errmsg ?? we.err?.errmsg ?? "";
          writeFailures.set(index, code === 11000
            ? { status: "duplicate", reason: describeDuplicateKey(msg) }
            : { status: "failed", reason: "Database rejected this record" });
        }
      }
    }

    const outcome = new Map(); // rowNumber -> final result
    const invitations = [];
    prepared.forEach((p, i) => {
      const fail = writeFailures.get(i);
      if (fail) {
        outcome.set(p.result.rowNumber, { status: fail.status, errors: [fail.reason] });
      } else {
        outcome.set(p.result.rowNumber, { status: "imported", errors: [] });
        invitations.push({
          rowNumber: p.result.rowNumber,
          name: p.doc.name,
          employeeId: p.doc.employeeId,
          email: p.doc.email || "",
          inviteUrl: buildInviteUrl(p.invite.token),
          expiresAt: p.invite.expiresAt,
        });
      }
    });

    const finalRows = results.map((r) => {
      const o = outcome.get(r.rowNumber);
      return { ...publicRow(r), status: o ? o.status : r.status, errors: o ? o.errors : r.errors };
    });
    const count = (s) => finalRows.filter((r) => r.status === s).length;
    const summary = {
      total: finalRows.length,
      imported: count("imported"),
      failed: count("invalid") + count("failed"),
      duplicates: count("duplicate"),
    };

    await logAudit("employees.bulk_import", {
      actor: req.user,
      req,
      meta: { fileName: req.file.originalname, bytes: req.file.size, ...summary, isDummy },
    });

    res.status(summary.imported ? 201 : 200).json({ summary, rows: finalRows, invitations });
  } catch (e) {
    handleKnownErrors(next)(e);
  }
});

export default router;
