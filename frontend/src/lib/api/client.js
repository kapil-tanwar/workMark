const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const TOKEN_KEY = "wf_token";

export function getToken() {
  return typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export function normalizeUser(u) {
  if (!u) return null;
  return { ...u, id: u._id || u.id };
}

export async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.issues) ? data.issues[0]?.message : null) ||
      "Request failed";
    throw new Error(msg);
  }
  return data;
}
