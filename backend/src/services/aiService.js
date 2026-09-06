import Groq from "groq-sdk";
import User from "../models/User.js";
import Leave from "../models/Leave.js";
import Attendance from "../models/Attendance.js";
import { computeLeaveBalance, canRequestLeave } from "../utils/leaveBalance.js";
import { ensureEarnedAccrualUpToDate } from "../utils/earnedAccrual.js";

/* ── Groq client (lazy — so missing API key doesn't crash the route on import) ── */
let _groq = null;
let _model = null;
function getGroq() {
  const model = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";
  // Re-create client if model changed (e.g. after .env update + nodemon restart)
  if (!_groq || _model !== model) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set in backend/.env");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    _model = model;
  }
  return { groq: _groq, model: _model };
}

/* ────────────────── Tool definitions ────────────────── */
const tools = [
  {
    type: "function",
    function: {
      name: "getLeaveBalance",
      description:
        "Returns the employee's current leave balance — how many earned and comp-off leave days they have remaining, used, and total.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "getAttendanceSummary",
      description:
        "Returns the employee's attendance summary for a given month: total working days, present, late, absent, leave count, and attendance percentage.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "string",
            description:
              "Month in YYYY-MM format (e.g. '2026-08'). Defaults to the current month if omitted.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLeaveHistory",
      description:
        "Returns the employee's approved leave history for a given year, grouped by leave type.",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "string",
            description:
              "Year in YYYY format (e.g. '2026'). Defaults to the current year if omitted.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLateAttendance",
      description:
        "Returns the number of times the employee was marked late in a given month.",
      parameters: {
        type: "object",
        properties: {
          month: {
            type: "string",
            description:
              "Month in YYYY-MM format (e.g. '2026-08'). Defaults to the current month if omitted.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkLeaveAvailability",
      description:
        "Checks whether the employee can take a given number of leave days of a specific type. Returns current balance, requested days, whether leave can be taken, and remaining days after the leave.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "number",
            description: "Number of leave days the employee wants to take.",
          },
          leaveType: {
            type: "string",
            enum: ["Earned Leave", "Comp-Off Leave"],
            description:
              "Type of leave to check. Defaults to 'Earned Leave' if not specified.",
          },
        },
        required: ["days"],
      },
    },
  },
];

/* ────────────────── Tool implementations ────────────────── */

async function getLeaveBalance(userId) {
  await ensureEarnedAccrualUpToDate();
  const user = await User.findById(userId);
  const leaves = await Leave.find({ user: userId });
  return computeLeaveBalance(user, leaves, { includePending: true });
}

async function getAttendanceSummary(userId, month) {
  if (!month) {
    const now = new Date();
    month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const records = await Attendance.find({
    user: userId,
    date: { $gte: startDate, $lt: endDate },
  });

  const present = records.filter((r) => r.status === "Present").length;
  const late = records.filter((r) => r.status === "Late").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const leave = records.filter((r) => r.status === "Leave").length;
  const totalRecords = records.length;
  const effectivePresent = present + late; // late is still counted as present for %
  const attendancePct =
    totalRecords > 0 ? ((effectivePresent / totalRecords) * 100).toFixed(1) : "0.0";

  return {
    month,
    totalDays: totalRecords,
    present,
    late,
    absent,
    leave,
    attendancePercentage: `${attendancePct}%`,
  };
}

async function getLeaveHistory(userId, year) {
  if (!year) year = String(new Date().getFullYear());
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const leaves = await Leave.find({
    user: userId,
    status: "Approved",
    startDate: { $gte: startDate, $lte: endDate },
  });

  // Calculate days per leave type
  const breakdown = {};
  let total = 0;
  for (const l of leaves) {
    const dur = l.duration;
    let days;
    if (dur === "half" || dur === "0.5") days = 0.5;
    else if (dur !== "full" && !isNaN(parseFloat(dur))) days = parseFloat(dur);
    else {
      const a = new Date(l.startDate).getTime();
      const b = new Date(l.endDate).getTime();
      days = Math.max(1, Math.round((b - a) / 86400000) + 1);
    }
    breakdown[l.type] = (breakdown[l.type] || 0) + days;
    total += days;
  }

  return { year, totalApprovedDays: total, breakdown, leaveCount: leaves.length };
}

async function getLateAttendance(userId, month) {
  if (!month) {
    const now = new Date();
    month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  const [year, m] = month.split("-").map(Number);
  const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
  const endMonth = m === 12 ? 1 : m + 1;
  const endYear = m === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const count = await Attendance.countDocuments({
    user: userId,
    status: "Late",
    date: { $gte: startDate, $lt: endDate },
  });

  return { month, lateCount: count };
}

async function checkLeaveAvailability(userId, days, leaveType = "Earned Leave") {
  await ensureEarnedAccrualUpToDate();
  const user = await User.findById(userId);
  const leaves = await Leave.find({ user: userId });
  const balance = computeLeaveBalance(user, leaves, { includePending: true });

  const available = balance.remainingByType[leaveType] ?? 0;
  const canTake = available >= days;
  const remaining = canTake ? available - days : available;

  return {
    leaveType,
    requestedDays: days,
    availableDays: available,
    canTakeLeave: canTake,
    remainingAfterLeave: remaining,
  };
}

/* ── Map function names to implementations ── */
const toolMap = {
  getLeaveBalance,
  getAttendanceSummary,
  getLeaveHistory,
  getLateAttendance,
  checkLeaveAvailability,
};

/* ── Helper to strip internal reasoning tags (<think>...</think>) ── */
function cleanAiResponse(text) {
  if (!text || typeof text !== "string") return "";
  let cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .replace(/<think>[\s\S]*/gi, "")
    .trim();
  return cleaned;
}

/* ────────────────── Main handler ────────────────── */
const SYSTEM_PROMPT = `You are the WorkFlow HR AI Assistant. You help employees with their HR queries — leave balance, attendance, leave history, late arrivals, and leave availability.

Rules:
- Be friendly, professional, clear, and concise.
- NEVER output internal reasoning, thought scratchpads, or <think>...</think> tags. Output only the final response for the user.
- Always use the provided tools to fetch real data. Never invent numbers.
- Format responses cleanly with bold highlights for key numbers/dates, and bullet points for lists.
- If the user asks something outside HR scope, politely say you can only help with HR-related queries.
- When referring to leave types, use "Earned Leave" and "Comp-Off Leave".
- When a month isn't specified, assume the current month.
- When a year isn't specified, assume the current year.`;

export async function handleAiMessage(userMessage, user) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `[Employee: ${user.name}, ID: ${user.employeeId || "N/A"}]\n\n${userMessage}`,
    },
  ];

  // Step 1: Send message + tool definitions to Groq
  const { groq, model } = getGroq();
  const response = await groq.chat.completions.create({
    model,
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.3,
    max_tokens: 1024,
  });

  const assistantMsg = response.choices[0].message;

  // If no tool call, return directly
  if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
    const raw = assistantMsg.content || "";
    return cleanAiResponse(raw) || "I'm not sure how to help with that. Try asking about your leaves, attendance, or late arrivals.";
  }

  // Step 2: Execute all tool calls
  messages.push(assistantMsg);

  for (const toolCall of assistantMsg.tool_calls) {
    const fnName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments || "{}");
    const fn = toolMap[fnName];

    if (!fn) {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: `Unknown function: ${fnName}` }),
      });
      continue;
    }

    try {
      let result;
      switch (fnName) {
        case "getLeaveBalance":
          result = await fn(user._id);
          break;
        case "getAttendanceSummary":
          result = await fn(user._id, args.month);
          break;
        case "getLeaveHistory":
          result = await fn(user._id, args.year);
          break;
        case "getLateAttendance":
          result = await fn(user._id, args.month);
          break;
        case "checkLeaveAvailability":
          result = await fn(user._id, args.days, args.leaveType);
          break;
        default:
          result = { error: "Not implemented" };
      }
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    } catch (err) {
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify({ error: err.message }),
      });
    }
  }

  // Step 3: Let the model generate a natural-language response from the tool results
  const finalResponse = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  });

  const finalRaw = finalResponse.choices[0].message.content || "";
  const cleaned = cleanAiResponse(finalRaw);
  return (
    cleaned ||
    "Sorry, I could not generate a response. Please try again."
  );
}
