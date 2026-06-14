import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

function sign(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function normalizeEmployeeId(id) {
  return String(id || "").trim().toUpperCase();
}

function normalizeEmail(email) {
  const trimmed = String(email || "").trim().toLowerCase();
  return trimmed || undefined;
}

const signupSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    password: z.string().min(6).max(200),
    role: z.enum(["admin", "employee"]).default("employee"),
    employeeId: z.string().max(32).optional(),
    phone: z.string().min(7).max(20),
    department: z.string().max(120).optional(),
    designation: z.string().max(120).optional(),
  })
  .superRefine((data, ctx) => {
    const norm = normalizeEmployeeId(data.employeeId);
    if (!norm || norm.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Employee ID is required", path: ["employeeId"] });
    }
  });

router.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const email = normalizeEmail(data.email);
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) return next({ status: 409, message: "Email already registered" });
    }

    const phone = data.phone.trim();
    if (await User.findOne({ phone })) {
      return next({ status: 409, message: "Phone number already registered" });
    }

    const employeeId = normalizeEmployeeId(data.employeeId);
    if (employeeId.length < 2 || employeeId.length > 32) {
      return next({ status: 400, message: "Employee ID must be 2–32 characters" });
    }
    if (await User.findOne({ employeeId })) {
      return next({ status: 409, message: "Employee ID already in use" });
    }

    const user = await User.create({
      name: data.name,
      ...(email ? { email } : {}),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      employeeId,
      phone,
      department: data.department || (data.role === "admin" ? "Administration" : "General"),
      designation: data.designation || (data.role === "admin" ? "Administrator" : "Team Member"),
    });
    res.status(201).json({ token: sign(user), user });
  } catch (e) { next(e); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);
    const identifier = email.trim();
    const user = await User.findOne({
      $or: [
        ...(identifier.includes("@") ? [{ email: identifier.toLowerCase() }] : []),
        { employeeId: normalizeEmployeeId(identifier) },
      ],
    });
    if (!user) return next({ status: 401, message: "Invalid credentials" });
    if (!user.active) {
      return next({ status: 403, message: "Account disabled. Contact your administrator." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return next({ status: 401, message: "Invalid credentials" });
    res.json({ token: sign(user), user });
  } catch (e) { next(e); }
});

router.get("/me", authRequired, (req, res) => res.json({ user: req.user }));

router.post("/forgot-password", async (req, res) => {
  // Stub — wire up email provider in production.
  res.json({ ok: true, message: "If the email exists, a reset link has been sent." });
});

export default router;
