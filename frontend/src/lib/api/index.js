export { getToken, setToken, normalizeUser, request } from "./client";
export * from "./auth";
export * from "./employees";
export * from "./attendance";
export * from "./leaves";
export * from "./settings";

export async function healthCheck() {
  return (await import("./client")).request("/health");
}
