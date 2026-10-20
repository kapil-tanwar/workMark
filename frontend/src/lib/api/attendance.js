import { request } from "./client";

export async function getAttendance(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`/api/attendance${qs ? `?${qs}` : ""}`);
  return data.records || [];
}

export async function getTodayAttendance(date) {
  const qs = date ? `?date=${date}` : "";
  const data = await request(`/api/attendance/today${qs}`);
  return data.record;
}

export async function checkIn(date, time) {
  const data = await request("/api/attendance/check-in", {
    method: "POST",
    body: JSON.stringify({ date, time }),
  });
  return data.record;
}

export async function checkOut(date, time) {
  const data = await request("/api/attendance/check-out", {
    method: "POST",
    body: JSON.stringify({ date, time }),
  });
  return data.record;
}

export async function getAttendanceSummary(userId) {
  return request(`/api/attendance/summary/${userId}`);
}
