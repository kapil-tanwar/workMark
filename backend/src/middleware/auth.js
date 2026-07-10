import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next({ status: 401, message: "Unauthorized" });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active)
      return next({ status: 401, message: "Invalid session" });
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      return next({ status: 401, message: "Session expired" });
    }
    req.user = user;
    next();
  } catch {
    next({ status: 401, message: "Invalid token" });
  }
}

export function adminOnly(req, _res, next) {
  if (req.user?.role !== "admin")
    return next({ status: 403, message: "Admin only" });
  next();
}
