export const DEFAULT_SETTINGS = {
  companyName: "Acme Corporation",
  companyEmail: "hr@acme.co",
  workingHours: "09:00 – 18:00",
  leaveAllocation: { casual: 8, sick: 10, earned: 12 },
};

export const cache = {
  users: [],
  attendance: [],
  leaves: [],
  settings: { ...DEFAULT_SETTINGS },
};

export function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wf:change"));
  }
}
