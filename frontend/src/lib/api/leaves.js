import { request } from "./client";

export async function getLeaves(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`/api/leaves${qs ? `?${qs}` : ""}`);
  return data.leaves || [];
}

export async function createLeave(body) {
  const data = await request("/api/leaves", { method: "POST", body: JSON.stringify(body) });
  return data.leave;
}

export async function approveLeave(id) {
  const data = await request(`/api/leaves/${id}/approve`, { method: "PATCH" });
  return data.leave;
}

export async function rejectLeave(id) {
  const data = await request(`/api/leaves/${id}/reject`, { method: "PATCH" });
  return data.leave;
}

export async function deleteLeave(id) {
  return request(`/api/leaves/${id}`, { method: "DELETE" });
}
