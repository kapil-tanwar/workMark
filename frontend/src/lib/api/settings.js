import { request } from "./client";

const DEFAULT_ALLOCATION = { casual: 8, sick: 10, earned: 12 };

export async function getSettings() {
  const data = await request("/api/settings");
  const s = data.settings || {};
  return {
    companyName: s.companyName || "Acme Corporation",
    companyEmail: s.companyEmail || "hr@acme.co",
    workingHours: s.workingHours || "09:00 – 18:00",
    leaveAllocation: s.leaveAllocation || DEFAULT_ALLOCATION,
  };
}

export async function patchSettings(body) {
  const data = await request("/api/settings", { method: "PATCH", body: JSON.stringify(body) });
  const s = data.settings || {};
  return {
    companyName: s.companyName,
    companyEmail: s.companyEmail,
    workingHours: s.workingHours,
    leaveAllocation: s.leaveAllocation,
  };
}
