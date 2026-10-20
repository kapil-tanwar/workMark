import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authRequired(req, _res, next) {
  try {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const cookieToken = cookies.wf_token;
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;
    const token = cookieToken || bearerToken;
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

export function isDemoUser(user) {
  if (!user) return false;
  if (user.isDummy) return true;
  const email = (user.email || "").toLowerCase();
  const empId = (user.employeeId || "").toUpperCase();
  return (
    email === "admin@admin.com" ||
    email === "employee@employee.com" ||
    email === "admin11111@demo.com" ||
    email === "employee@demo.com" ||
    empId === "ADMIN00" ||
    empId === "EMPLOYEE00"
  );
}

export function adminOnly(req, _res, next) {
  if (req.user?.role !== "admin")
    return next({ status: 403, message: "Admin only" });
  next();
}

