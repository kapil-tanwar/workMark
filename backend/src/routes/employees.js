import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", async (_req, res, next) => {
  try { res.json({ employees: await User.find().sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ employee: u });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  employeeId: z.string().min(2).max(32),
  role: z.enum(["admin", "employee"]).default("employee"),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().min(7).max(20),
});

router.post("/", adminOnly, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (await User.findOne({ email: data.email.toLowerCase() }))
      return next({ status: 409, message: "Email already exists" });
    const phone = data.phone.trim();
    if (await User.findOne({ phone }))
      return next({ status: 409, message: "Phone number already in use" });
    const employeeId = data.employeeId.trim().toUpperCase();
    if (await User.findOne({ employeeId }))
      return next({ status: 409, message: "Employee ID already in use" });
    const { password, ...rest } = data;
    const u = await User.create({
      ...rest,
      phone,
      employeeId,
      passwordHash: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ employee: u });
  } catch (e) { next(e); }
});

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  employeeId: z.string().min(2).max(32).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
});

router.patch("/:id", adminOnly, async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const patch = { ...data };
    if (data.employeeId) {
      const employeeId = data.employeeId.trim().toUpperCase();
      const taken = await User.findOne({ employeeId, _id: { $ne: req.params.id } });
      if (taken) return next({ status: 409, message: "Employee ID already in use" });
      patch.employeeId = employeeId;
    }
    if (data.phone) {
      const phone = data.phone.trim();
      const taken = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (taken) return next({ status: 409, message: "Phone number already in use" });
      patch.phone = phone;
    }
    if (data.password) {
      patch.passwordHash = await bcrypt.hash(data.password, 10);
      delete patch.password;
    }
    const u = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ employee: u });
  } catch (e) { next(e); }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
