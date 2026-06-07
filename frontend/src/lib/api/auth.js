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
  setToken(data.token);
  return { user: normalizeUser(data.user), token: data.token };
}

export async function fetchMe() {
  const data = await request("/api/auth/me");
  return normalizeUser(data.user);
}

export async function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
