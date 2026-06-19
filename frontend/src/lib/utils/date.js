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

/**
 * Returns true if current time is past 12:30 PM.
 * After 12:30 PM, absent employees cannot check in.
 */
export function isPastCheckinDeadline(date = new Date()) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return hours > 12 || (hours === 12 && minutes >= 30);
}

/**
 * Returns true if current time is at or past 18:00 (6 PM).
 */
export function isPastAutoCheckout(date = new Date()) {
  return date.getHours() >= 18;
}

/**
 * Gets the 6 PM auto-checkout time string "18:00"
 */
export function getAutoCheckoutTime() {
  return "18:00";
}
