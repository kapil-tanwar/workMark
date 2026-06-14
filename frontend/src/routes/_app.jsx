import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { isAuthenticated } from "@/lib/auth-storage";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated()) throw redirect({ to: "/login", replace: true });
  },
  component: AppLayout,
});
