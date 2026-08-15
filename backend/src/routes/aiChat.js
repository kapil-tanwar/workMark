import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { handleAiMessage } from "../services/aiService.js";

const router = Router();

// POST /api/ai/chat
// Body: { "message": "How many leaves do I have?" }
// Response: { "answer": "You currently have 6 earned leaves and ..." }
router.post("/", authRequired, async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return next({ status: 400, message: "Message is required" });
    }

    if (message.length > 500) {
      return next({ status: 400, message: "Message too long (max 500 characters)" });
    }

    const answer = await handleAiMessage(message.trim(), req.user);
    res.json({ answer });
  } catch (err) {
    console.error("[AI Chat Error]", err.message);
    // Don't expose internal AI errors to the client
    if (err.status) return next(err);
    res.status(500).json({
      answer:
        "I'm having trouble processing your request right now. Please try again in a moment.",
    });
  }
});

export default router;
