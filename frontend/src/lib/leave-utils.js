export const LEAVE_TYPES = ["Earned Leave", "Comp-Off Leave"];

export function leaveRequestDays(startDate, endDate, duration = "full") {
  if (startDate === endDate && duration === "half") return 0.5;
  const a = new Date(startDate).getTime();
  const b = new Date(endDate).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

export function leaveDaysFromRecord(leave) {
  return leaveRequestDays(leave.startDate, leave.endDate, leave.duration || "full");
}

function sumUsedDays(leaves, type) {
  return leaves
    .filter((l) => l.type === type)
    .reduce((sum, l) => sum + leaveDaysFromRecord(l), 0);
}

export function computeLeaveBalance(user, leaves, { includePending = true } = {}) {
  const statuses = includePending ? ["Approved", "Pending"] : ["Approved"];
  const relevant = leaves.filter((l) => statuses.includes(l.status));

  const balances = user?.leaveBalances || {};
  const earnedTotal = balances.earnedTotal ?? 0;
  const compOffTotal = balances.compOffTotal ?? 0;

  const earnedUsed = sumUsedDays(relevant, "Earned Leave");
  const compOffUsed = sumUsedDays(relevant, "Comp-Off Leave");

  const earnedRemaining = earnedTotal - earnedUsed;
  const compOffRemaining = compOffTotal - compOffUsed;

  return {
    earned: { total: earnedTotal, used: earnedUsed, remaining: earnedRemaining },
    compOff: { total: compOffTotal, used: compOffUsed, remaining: compOffRemaining },
    totalRemaining: earnedRemaining + compOffRemaining,
    taken: earnedUsed + compOffUsed,
    total: earnedTotal + compOffTotal,
    used: {
      "Earned Leave": earnedUsed,
      "Comp-Off Leave": compOffUsed,
    },
    remainingByType: {
      "Earned Leave": earnedRemaining,
      "Comp-Off Leave": compOffRemaining,
    },
  };
}

export function canRequestLeave(user, leaves, type, startDate, endDate, duration = "full") {
  if (duration === "half" && startDate !== endDate) {
    return { ok: false, message: "Half-day leave must be for a single date." };
  }
  const requested = leaveRequestDays(startDate, endDate, duration);
  const balance = computeLeaveBalance(user, leaves, { includePending: true });
  const available = balance.remainingByType[type] ?? 0;
  if (requested > available) {
    return {
      ok: false,
      message: `Insufficient ${type}. Requested ${requested} day(s) but only ${Math.max(0, available)} available.`,
    };
  }
  return { ok: true, requested, available };
}

export function leaveDays(startDate, endDate, duration = "full") {
  return leaveRequestDays(startDate, endDate, duration);
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export { fmt as formatLeaveDays };
