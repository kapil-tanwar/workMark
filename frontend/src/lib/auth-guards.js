import { redirect } from "@tanstack/react-router";
import { getStoredUser, isAuthenticated } from "./auth-storage";

export function homePathForRole(role) {
  return role === "admin" ? "/admin" : "/dashboard";
}

export function requireGuest() {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) return;
  const user = getStoredUser();
  throw redirect({ to: homePathForRole(user?.role), replace: true });
}

export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) throw redirect({ to: "/login", replace: true });
  const user = getStoredUser();
  if (!user?.role) throw redirect({ to: "/login", replace: true });
  return user;
}

export function requireAuthWithRole(location) {
  const user = requireAuth();
  const path = location.pathname;
  const isAdminRoute = path === "/admin" || path.startsWith("/admin/");

  if (isAdminRoute && user.role !== "admin") {
    throw redirect({ to: "/dashboard", replace: true });
  }

  if (!isAdminRoute && user.role === "admin") {
    throw redirect({ to: "/admin", replace: true });
  }

  return user;
}
