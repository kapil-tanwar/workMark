import { request } from "./client";

export async function getAttendance(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`/api/attendance${qs ? `?${qs}` : ""}`);
  return data.records || [];
}

export async function getTodayAttendance() {
  const data = await request("/api/attendance/today");
  return data.record;
}

export async function checkIn() {
  const data = await request("/api/attendance/check-in", { method: "POST" });
  return data.record;
}

export async function checkOut() {
  const data = await request("/api/attendance/check-out", { method: "POST" });
  return data.record;
}

export async function getAttendanceSummary(userId) {
  return request(`/api/attendance/summary/${userId}`);
}
