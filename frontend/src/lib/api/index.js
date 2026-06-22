export { getToken, setToken, normalizeUser, request } from "./client";
export * from "./auth";
export * from "./employees";
export * from "./attendance";
export * from "./leaves";
export * from "./compOff";
export * from "./settings";
export * from "./notifications";

export async function healthCheck() {
  return (await import("./client")).request("/health");
}
