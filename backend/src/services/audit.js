import AuditLog from "../models/AuditLog.js";

/**
 * Best-effort audit trail. Never throws: a logging failure must not break the
 * request that triggered it. Never put secrets (tokens, passwords) in `meta`.
 */
export async function logAudit(action, { actor, req, meta = {} } = {}) {
  const entry = {
    action,
    actorId: actor?._id,
    actorEmployeeId: actor?.employeeId,
    ip: req?.ip,
    meta,
  };
  console.log(
    `[audit] ${action} actor=${entry.actorEmployeeId || "system"} ${JSON.stringify(meta)}`,
  );
  try {
    await AuditLog.create(entry);
  } catch (err) {
    console.error("[audit] failed to persist entry:", err.message);
  }
}
