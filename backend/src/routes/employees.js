import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { authRequired, adminOnly } from "../middleware/auth.js";
import { creditNewEmployeeEarnedLeave } from "../utils/earnedAccrual.js";

const router = Router();
router.use(authRequired);

// admin : gets all employee
router.get("/", adminOnly, async (_req, res, next) => {
  try { res.json({ employees: await User.find().sort({ createdAt: -1 }) }); }
  catch (e) { next(e); }
});

// gets the details for a specific employee.
router.get("/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && String(req.user._id) !== req.params.id) {
      return next({ status: 403, message: "Forbidden" });
    }
    const u = await User.findById(req.params.id);
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ employee: u });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  name: z.string().min(1),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  password: z.string().min(6),
  employeeId: z.string().min(2).max(32),
  role: z.enum(["admin", "employee"]).default("employee"),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().min(7).max(20),
  earnedLeaves: z.number().optional(),
  compOffLeaves: z.number().optional(),
});

// admin : creates a new employee 
router.post("/", adminOnly, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const email = data.email?.trim() ? data.email.trim().toLowerCase() : undefined;
    if (email && (await User.findOne({ email })))
      return next({ status: 409, message: "Email already exists" });
    const phone = data.phone.trim();
    if (await User.findOne({ phone }))
      return next({ status: 409, message: "Phone number already in use" });
    const employeeId = data.employeeId.trim().toUpperCase();
    if (await User.findOne({ employeeId }))
      return next({ status: 409, message: "Employee ID already in use" });
    const { password, email: _e, earnedLeaves, compOffLeaves, ...rest } = data;
    const u = await User.create({
      ...rest,
      ...(email ? { email } : {}),
      phone,
      employeeId,
      passwordHash: await bcrypt.hash(password, 10),
      leaveBalances: {
        earnedTotal: earnedLeaves !== undefined ? earnedLeaves : 0,
        compOffTotal: compOffLeaves !== undefined ? compOffLeaves : 0,
        lastEarnedAccrualAt: new Date()
      }
    });
    if (u.role === "employee" && earnedLeaves === undefined) {
      await creditNewEmployeeEarnedLeave(u._id);
    }
    const employee = await User.findById(u._id);
    res.status(201).json({ employee });
  } catch (e) { next(e); }
});

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  employeeId: z.string().min(2).max(32).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  phone: z.string().min(7).max(20).optional(),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
  earnedLeaves: z.number().optional(),
  compOffLeaves: z.number().optional(),
});

// admin  updates an employee's details 
router.patch("/:id", adminOnly, async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const patch = { ...data };
    delete patch.email;
    delete patch.earnedLeaves;
    delete patch.compOffLeaves;

    if (data.earnedLeaves !== undefined) {
      patch["leaveBalances.earnedTotal"] = data.earnedLeaves;
    }
    if (data.compOffLeaves !== undefined) {
      patch["leaveBalances.compOffTotal"] = data.compOffLeaves;
    }

    if (data.email !== undefined) {
      const email = data.email?.trim() ? data.email.trim().toLowerCase() : undefined;
      if (email) {
        const taken = await User.findOne({ email, _id: { $ne: req.params.id } });
        if (taken) return next({ status: 409, message: "Email already in use" });
        patch.email = email;
      }
    }
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

    const unset = {};
    if (data.email !== undefined && !data.email?.trim()) unset.email = "";

    const update = { ...patch };
    if (Object.keys(unset).length) update.$unset = unset;

    const u = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ employee: u });
  } catch (e) { next(e); }
});

// admin : deletes  employee
router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return next({ status: 404, message: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
