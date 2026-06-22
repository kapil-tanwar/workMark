import { request, setToken, normalizeUser } from "./client";

export async function login(identifier, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: identifier.trim(), password }),
  });
  setToken(data.token);
  return { user: normalizeUser(data.user), token: data.token };
}

export async function signup(input) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (data.pending) {
    return { pending: true, message: data.message };
  }
  setToken(data.token);
  return { user: normalizeUser(data.user), token: data.token };
}

export async function fetchMe() {
  const data = await request("/api/auth/me");
  return normalizeUser(data.user);
}

export async function updateProfile(body) {
  const data = await request("/api/auth/profile", { method: "PATCH", body: JSON.stringify(body) });
  return normalizeUser(data.user);
}

export async function sendResetOtp({ identifier, phone }) {
  return request("/api/auth/forgot-password/send-otp", {
    method: "POST",
    body: JSON.stringify({ identifier, phone }),
  });
}

export async function forgotPassword({ identifier, phone, otp, newPassword }) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ identifier, phone, otp, newPassword }),
  });
}
