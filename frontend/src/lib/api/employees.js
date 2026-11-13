import { request, requestBlob, normalizeUser } from "./client";

export async function getEmployees() {
  const data = await request("/api/employees");
  return (data.employees || []).map(normalizeUser);
}

export async function createEmployee(body) {
  const data = await request("/api/employees", { method: "POST", body: JSON.stringify(body) });
  return normalizeUser(data.employee);
}

export async function updateEmployee(id, body) {
  const data = await request(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeUser(data.employee);
}

export async function deleteEmployee(id) {
  return request(`/api/employees/${id}`, { method: "DELETE" });
}

/* ── Bulk import ── */

export function getBulkImportSpec() {
  return request("/api/employees/bulk-import/spec");
}

export function downloadImportTemplate(format = "xlsx") {
  return requestBlob(
    `/api/employees/bulk-import/template?format=${format === "csv" ? "csv" : "xlsx"}`,
  );
}

function fileBody(file) {
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Parse + validate on the server. Writes nothing. */
export function previewBulkImport(file) {
  return request("/api/employees/bulk-import/preview", { method: "POST", body: fileBody(file) });
}

/** Re-validates the file on the server and imports every valid row. */
export function runBulkImport(file) {
  return request("/api/employees/bulk-import", { method: "POST", body: fileBody(file) });
}

/** One-time invitation link for an employee who has not set a password yet. */
export function regenerateEmployeeInvite(id) {
  return request(`/api/employees/${id}/invite`, { method: "POST" });
}
