import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { requireAuthWithRole } from "@/lib/auth-guards";

export const Route = createFileRoute("/_app")({
  beforeLoad: ({ location }) => {
    requireAuthWithRole(location);
  },
  component: AppLayout,
});
