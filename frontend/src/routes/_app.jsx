import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { getSavedUser } from "@/lib/auth-helpers";
export const Route = createFileRoute("/_app")({
    beforeLoad: ({ location }) => {
        if (typeof window === "undefined")
            return;
        const token = localStorage.getItem("wf_token");
        if (!token)
            throw redirect({ to: "/login" });
        const user = getSavedUser();
        if (!user)
            return;
        const path = location.pathname;
        const isAdmin = user.role === "admin";
        if (isAdmin) {
            if (!path.startsWith("/admin")) {
                localStorage.removeItem("wf_token");
                localStorage.removeItem("wf_user");
                throw redirect({ to: "/admin/login" });
            }
        }
        else {
            if (path.startsWith("/admin")) {
                localStorage.removeItem("wf_token");
                localStorage.removeItem("wf_user");
                throw redirect({ to: "/login" });
            }
        }
    },
    component: AppLayout,
});
