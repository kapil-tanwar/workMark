import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getToken } from "@/lib/api/client";

export const Route = createFileRoute("/_app")({
    beforeLoad: () => {
        if (typeof window === "undefined")
            return;
        if (!getToken())
            throw redirect({ to: "/login" });
    },
    component: AppLayout,
});
