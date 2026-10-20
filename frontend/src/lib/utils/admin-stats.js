import { isDateInRange } from "./date";

export function isOnApprovedLeave(leaves, userId, date) {
  return leaves.some(
    (l) => l.status === "Approved" && l.userId === userId && isDateInRange(date, l.startDate, l.endDate)
  );
}

export function getOnLeaveUserIds(employees, leaves, attendance, date) {
  const employeeIds = new Set(employees.map((u) => u.id));
  const onLeave = new Set();

  for (const emp of employees) {
    if (isOnApprovedLeave(leaves, emp.id, date)) onLeave.add(emp.id);
  }

  for (const rec of attendance) {
    if (rec.date === date && rec.status === "Leave" && employeeIds.has(rec.userId)) {
      onLeave.add(rec.userId);
    }
  }

  return onLeave;
}

export function computeDailyAttendanceStats(employees, leaves, attendance, date) {
  const employeeIds = new Set(employees.map((u) => u.id));
  const onLeaveIds = getOnLeaveUserIds(employees, leaves, attendance, date);
  const dayRecs = attendance.filter((a) => a.date === date && employeeIds.has(a.userId));

  const present = dayRecs.filter(
    (r) => (r.status === "Present" || r.status === "Late") && !onLeaveIds.has(r.userId)
  ).length;

  const onLeave = onLeaveIds.size;
  const absent = Math.max(0, employees.length - present - onLeave);

  return { present, absent, onLeave, total: employees.length };
}

export function buildWeeklyChartData(employees, leaves, attendance, days) {
  const employeeIds = new Set(employees.map((u) => u.id));

  return days.map((d) => {
    const onLeaveIds = getOnLeaveUserIds(employees, leaves, attendance, d.date);
    const recs = attendance.filter((a) => a.date === d.date && employeeIds.has(a.userId));
    const present = recs.filter(
      (r) => (r.status === "Present" || r.status === "Late") && !onLeaveIds.has(r.userId)
    ).length;

    return {
      day: d.label,
      date: d.date,
      isWeekend: d.isWeekend,
      Present: present,
      Absent: Math.max(0, employees.length - present - onLeaveIds.size),
      Leave: onLeaveIds.size,
    };
  });
}
