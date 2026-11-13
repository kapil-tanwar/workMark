import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const INVITE_TTL_DAYS = 7;

export function hashInviteToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

/** Returns the plaintext token (shown once) plus what we persist. */
export function createInviteToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashInviteToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
  };
}

export function buildInviteUrl(token) {
  const base =
    process.env.APP_URL ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "http://localhost:8080";
  return `${base.replace(/\/$/, "")}/accept-invite/${token}`;
}

/**
 * passwordHash is required by the schema, so invited accounts get a hash of a
 * random secret nobody ever sees. Low cost factor is fine: the secret has 256
 * bits of entropy and is discarded — this keeps 1000-row imports fast.
 */
export async function unusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 4);
}
