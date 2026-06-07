/** Returns YYYY-MM-DD strings from start through end (inclusive). */
export function dateRange(startDate, endDate) {
  const dates = [];
  const cur = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
