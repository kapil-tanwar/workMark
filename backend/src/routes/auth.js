import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authenticator } from "otplib";
import qrcode from "qrcode";

authenticator.options = { window: [2, 2] };
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { creditNewEmployeeEarnedLeave } from "../utils/earnedAccrual.js";
import { notifyAdmins } from "../services/notification.js";

const router = Router();


function sign(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, tv: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

function normalizeEmployeeId(id) {
  return String(id || "")
    .trim()
    .toUpperCase();
}

function normalizeEmail(email) {
  const trimmed = String(email || "")
    .trim()
    .toLowerCase();
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
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Employee ID is required",
        path: ["employeeId"],
      });
    }
  });


router.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const email = normalizeEmail(data.email);
    if (email) {
      const existing = await User.findOne({ email });
      if (existing)
        return next({ status: 409, message: "Email already registered" });
    }

    const phone = data.phone.trim();
    if (await User.findOne({ phone })) {
      return next({ status: 409, message: "Phone number already registered" });
    }

    const employeeId = normalizeEmployeeId(data.employeeId);
    if (employeeId.length < 2 || employeeId.length > 32) {
      return next({
        status: 400,
        message: "Employee ID must be 2–32 characters",
      });
    }
    if (await User.findOne({ employeeId })) {
      return next({ status: 409, message: "Employee ID already in use" });
    }

    let approvalStatus = "approved";
    if (data.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount > 0) {
        approvalStatus = "pending";
      }
    }

    const user = await User.create({
      name: data.name,
      ...(email ? { email } : {}),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
      employeeId,
      phone,
      department: data.department || "IT",
      designation:
        data.designation ||
        (data.role === "admin" ? "Administrator" : "Team Member"),
      approvalStatus,
    });
    if (user.role === "employee") await creditNewEmployeeEarnedLeave(user._id);
    const fresh = await User.findById(user._id);

    if (approvalStatus === "pending") {
      await notifyAdmins(
        "New Admin Request",
        `${data.name} has requested admin access.`,
        "admin",
      );
      res
        .status(201)
        .json({ pending: true, message: "Admin request sent for approval" });
    } else {
      res.status(201).json({ token: sign(fresh), user: fresh });
    }
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {

    const { email, password } = z
      .object({ email: z.string().min(1), password: z.string().min(1) })
      .parse(req.body);
    const identifier = email.trim();
    const user = await User.findOne({
      $or: [
        ...(identifier.includes("@")
          ? [{ email: identifier.toLowerCase() }]
          : []),
        { employeeId: normalizeEmployeeId(identifier) },
      ],
    });
    if (!user) return next({ status: 401, message: "Invalid credentials" });
    if (user.approvalStatus === "pending") {
      return next({ status: 403, message: "Account pending admin approval." });
    }
    if (user.approvalStatus === "rejected") {
      return next({ status: 403, message: "Account request rejected." });
    }
    if (!user.active) {
      return next({
        status: 403,
        message: "Account disabled. Contact your administrator.",
      });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return next({ status: 401, message: "Invalid credentials" });

    res.json({ token: sign(user), user });
  } catch (e) {
    next(e);
  }
});

router.get("/me", authRequired, (req, res) => res.json({ user: req.user }));

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  phone: z.string().min(7).max(20).optional(),
  department: z.string().max(120).optional(),
  designation: z.string().max(120).optional(),
});


router.patch("/profile", authRequired, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const patch = {};

    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.department !== undefined)
      patch.department = data.department.trim();
    if (data.designation !== undefined)
      patch.designation = data.designation.trim();

    if (data.email !== undefined) {
      const email = normalizeEmail(data.email);
      if (email) {
        const taken = await User.findOne({ email, _id: { $ne: req.user._id } });
        if (taken)
          return next({ status: 409, message: "Email already in use" });
        patch.email = email;
      }
    }

    if (data.phone !== undefined) {
      const phone = data.phone.trim();
      const taken = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (taken)
        return next({ status: 409, message: "Phone number already in use" });
      patch.phone = phone;
    }

    const user = await User.findByIdAndUpdate(req.user._id, patch, {
      new: true,
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {

    const { identifier, phone, otp, newPassword } = z
      .object({
        identifier: z.string().min(1),
        phone: z.string().min(7).max(20),
        otp: z.string().min(6).max(6),
        newPassword: z.string().min(6).max(200),
      })
      .parse(req.body);

    const idVal = identifier.trim();
    const phoneVal = phone.trim();

    const query = { phone: phoneVal };
    if (idVal.includes("@")) {
      query.email = idVal.toLowerCase();
    } else {
      query.employeeId = normalizeEmployeeId(idVal);
    }

    const user = await User.findOne(query);
    if (!user || !user.is2faEnabled || !user.totpSecret) {
      return next({
        status: 401,
        message: "Invalid details or Authenticator code",
      });
    }

    const isValid = authenticator.verify({
      token: otp,
      secret: user.totpSecret,
    });
    if (!isValid) {
      return next({ status: 401, message: "Invalid Authenticator Code" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await user.save();


    res.json({ ok: true, message: "Password has been reset successfully." });
  } catch (e) {
    next(e);
  }
});


router.post("/2fa/generate", authRequired, async (req, res, next) => {
  try {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(
      req.user.email || req.user.employeeId,
      "WorkFlow HR",
      secret,
    );
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

    req.user.pendingTotpSecret = secret;
    await req.user.save();

    res.json({ secret, qrCode: qrCodeDataUrl });
  } catch (e) {
    next(e);
  }
});

router.post("/2fa/verify", authRequired, async (req, res, next) => {
  try {

    const otp = String(req.body?.otp || "").trim();
    const secret = req.user.pendingTotpSecret || req.user.totpSecret;
    if (!secret) {
      return next({
        status: 400,
        message: "No 2FA secret found to verify. Generate one first.",
      });
    }

    const isValid = authenticator.verify({ token: otp, secret });
    if (!isValid) {
      return next({ status: 401, message: "Invalid Authenticator Code" });
    }

    req.user.totpSecret = secret;
    req.user.pendingTotpSecret = undefined;
    req.user.is2faEnabled = true;
    await req.user.save();


    res.json({ message: "2FA successfully enabled.", user: req.user });
  } catch (e) {
    next(e);
  }
});

export default router;
