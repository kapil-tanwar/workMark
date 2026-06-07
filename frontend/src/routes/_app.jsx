import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
export const Route = createFileRoute("/_app")({
    beforeLoad: () => {
        if (typeof window === "undefined")
            return;
        const raw = localStorage.getItem("wf_session");
        if (!raw)
            throw redirect({ to: "/login" });
    },
    component: AppLayout,
});
