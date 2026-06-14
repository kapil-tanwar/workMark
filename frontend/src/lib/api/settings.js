import { request } from "./client";

export async function getSettings() {
  const data = await request("/api/settings");
  const s = data.settings || {};
  return {
    companyName: s.companyName || "Acme Corporation",
    companyEmail: s.companyEmail || "hr@acme.co",
    workingHours: s.workingHours || "09:00 – 18:00",
    monthlyEarnedAccrual: s.monthlyEarnedAccrual ?? 1.5,
  };
}

export async function patchSettings(body) {
  const data = await request("/api/settings", { method: "PATCH", body: JSON.stringify(body) });
  const s = data.settings || {};
  return {
    companyName: s.companyName,
    companyEmail: s.companyEmail,
    workingHours: s.workingHours,
    monthlyEarnedAccrual: s.monthlyEarnedAccrual ?? 1.5,
  };
}
