import { request } from "./client";

export async function getCompOffRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const data = await request(`/api/comp-off${qs ? `?${qs}` : ""}`);
  return data.requests || [];
}

export async function createCompOffRequest(body) {
  const data = await request("/api/comp-off", { method: "POST", body: JSON.stringify(body) });
  return data.request;
}

export async function approveCompOffRequest(id) {
  const data = await request(`/api/comp-off/${id}/approve`, { method: "PATCH" });
  return data.request;
}

export async function rejectCompOffRequest(id) {
  const data = await request(`/api/comp-off/${id}/reject`, { method: "PATCH" });
  return data.request;
}

export async function deleteCompOffRequest(id) {
  return request(`/api/comp-off/${id}`, { method: "DELETE" });
}
