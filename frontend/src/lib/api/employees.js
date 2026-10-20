import { request, normalizeUser } from "./client";

export async function getEmployees() {
  const data = await request("/api/employees");
  return (data.employees || []).map(normalizeUser);
}

export async function createEmployee(body) {
  const data = await request("/api/employees", { method: "POST", body: JSON.stringify(body) });
  return normalizeUser(data.employee);
}

export async function updateEmployee(id, body) {
  const data = await request(`/api/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return normalizeUser(data.employee);
}

export async function deleteEmployee(id) {
  return request(`/api/employees/${id}`, { method: "DELETE" });
}
