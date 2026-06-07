import { Router } from "express";
import { z } from "zod";
import Settings from "../models/Settings.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

router.get("/", async (_req, res, next) => {
  try {
    const s = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
    res.json({ settings: s });
  } catch (e) { next(e); }
});

const schema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional(),
  workingHours: z.string().optional(),
  leaveAllocation: z.object({
    casual: z.number().int().min(0),
    sick: z.number().int().min(0),
    earned: z.number().int().min(0),
  }).optional(),
});

router.patch("/", adminOnly, async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const s = await Settings.findOneAndUpdate({ key: "global" }, data, { new: true, upsert: true });
    res.json({ settings: s });
  } catch (e) { next(e); }
});

export default router;
