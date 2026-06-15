import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/lib/auth-storage";

const BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export function getToken() {
  return getStoredToken();
}

export function setToken(token) {
  setStoredToken(token);
  if (!token) setStoredUser(null);
}

export function normalizeUser(u) {
  if (!u) return null;
  const normalized = { ...u, id: u._id || u.id };
  delete normalized._id;
  delete normalized.passwordHash;
  return normalized;
}

export async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Cannot reach the API at ${BASE}. Check that the backend is running and CORS allows this site.`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.error ||
      data.message ||
      (Array.isArray(data.issues) ? data.issues[0]?.message : null) ||
      "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export { BASE as API_BASE_URL };
