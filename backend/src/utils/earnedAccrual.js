import User from "../models/User.js";
import Settings from "../models/Settings.js";
import AccrualRun from "../models/AccrualRun.js";

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getMonthlyAccrualAmount() {
  const settings = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
  return settings.monthlyEarnedAccrual ?? 1.5;
}

export async function runMonthlyEarnedAccrual(forMonth = new Date()) {
  const key = monthKey(forMonth);
  const existing = await AccrualRun.findOne({ monthKey: key });
  if (existing) return { skipped: true, monthKey: key };

  const amount = await getMonthlyAccrualAmount();
  const accrualDate = new Date(forMonth.getFullYear(), forMonth.getMonth(), 1, 0, 0, 1);
  const monthEnd = new Date(forMonth.getFullYear(), forMonth.getMonth() + 1, 0, 23, 59, 59);

  const employees = await User.find({
    role: "employee",
    active: true,
    createdAt: { $lte: monthEnd },
  });

  for (const emp of employees) {
    const last = emp.leaveBalances?.lastEarnedAccrualAt
      ? new Date(emp.leaveBalances.lastEarnedAccrualAt)
      : null;
    if (last && last >= accrualDate) continue;

    await User.findByIdAndUpdate(emp._id, {
      $inc: { "leaveBalances.earnedTotal": amount },
      $set: { "leaveBalances.lastEarnedAccrualAt": accrualDate },
    });
  }

  await AccrualRun.create({ monthKey: key, amount, employeeCount: employees.length });
  return { skipped: false, monthKey: key, amount, employeeCount: employees.length };
}

/** Credit current month's earned leave when a new employee joins. */
export async function creditNewEmployeeEarnedLeave(userId) {
  const amount = await getMonthlyAccrualAmount();
  const now = new Date();
  const accrualDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 1);

  await User.findByIdAndUpdate(userId, {
    $inc: { "leaveBalances.earnedTotal": amount },
    $set: { "leaveBalances.lastEarnedAccrualAt": accrualDate },
  });

  return amount;
}


export async function ensureEarnedAccrualUpToDate() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const oldest = await User.findOne({ role: "employee" }).sort({ createdAt: 1 });
  if (!oldest) return { credited: 0 };

  let cursor = new Date(oldest.createdAt.getFullYear(), oldest.createdAt.getMonth(), 1);

  while (cursor <= currentMonthStart) {
    await runMonthlyEarnedAccrual(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
}

export function scheduleMonthlyAccrual() {
  const ONE_DAY = 24 * 60 * 60 * 1000;

  function msUntilNextFirst() {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 1);
    return Math.max(1000, next.getTime() - now.getTime());
  }

  function scheduleNext() {
    const delay = msUntilNextFirst();
    if (delay > ONE_DAY) {
      setTimeout(scheduleNext, ONE_DAY);
    } else {
      setTimeout(async () => {
        try {
          await runMonthlyEarnedAccrual(new Date());
        } catch (err) {
          console.error("Monthly earned leave accrual failed:", err.message);
        }
        scheduleNext();
      }, delay);
    }
  }

  scheduleNext();
}
