export function leaveDays(startDate, endDate) {
  const a = new Date(startDate).getTime();
  const b = new Date(endDate).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

const TYPES = ["Casual Leave", "Sick Leave", "Earned Leave"];

export function computeLeaveBalance(leaves, allocation, { includePending = true } = {}) {
  const statuses = includePending ? ["Approved", "Pending"] : ["Approved"];
  const relevant = leaves.filter((l) => statuses.includes(l.status));

  const used = Object.fromEntries(
    TYPES.map((type) => [
      type,
      relevant.filter((l) => l.type === type).reduce((sum, l) => sum + leaveDays(l.startDate, l.endDate), 0),
    ])
  );

  const remainingByType = {
    "Casual Leave": allocation.casual - used["Casual Leave"],
    "Sick Leave": allocation.sick - used["Sick Leave"],
    "Earned Leave": allocation.earned - used["Earned Leave"],
  };

  const total = allocation.casual + allocation.sick + allocation.earned;
  const taken = used["Casual Leave"] + used["Sick Leave"] + used["Earned Leave"];

  return {
    used,
    allocation,
    remainingByType,
    remaining: remainingByType["Casual Leave"] + remainingByType["Sick Leave"] + remainingByType["Earned Leave"],
    total,
    taken,
  };
}

export function canRequestLeave(leaves, allocation, type, startDate, endDate) {
  const requested = leaveDays(startDate, endDate);
  const balance = computeLeaveBalance(leaves, allocation, { includePending: true });
  const available = balance.remainingByType[type] ?? 0;
  if (requested > available) {
    return {
      ok: false,
      message: `Insufficient ${type}. Requested ${requested} day(s) but only ${Math.max(0, available)} available.`,
    };
  }
  return { ok: true, requested, available };
}
