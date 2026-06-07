export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function isSunday(date = new Date()) {
  return date.getDay() === 0;
}

/** Sunday is a non-working day — no check-in/out. */
export function isAttendanceBlocked(date = new Date()) {
  return isSunday(date);
}

export function lastNDays(n = 7, from = new Date()) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(from.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      dayOfWeek: d.getDay(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    });
  }
  return days;
}

export function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}
