export const DEFAULT_SETTINGS = {
  companyName: "Acme Corporation",
  companyEmail: "hr@acme.co",
  workingHours: "09:00 – 18:00",
  monthlyEarnedAccrual: 1.5,
};

export const cache = {
  users: [],
  attendance: [],
  leaves: [],
  compOffRequests: [],
  settings: { ...DEFAULT_SETTINGS },
};

export function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("wf:change"));
  }
}
