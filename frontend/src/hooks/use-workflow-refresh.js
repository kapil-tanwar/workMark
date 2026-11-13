import { useEffect, useState } from "react";
import { refreshStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";

export function useWorkflowRefresh() {
  const [, tick] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    refreshStore(user)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          tick((n) => n + 1);
        }
      });
    const handler = () => tick((n) => n + 1);
    window.addEventListener("wf:change", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("wf:change", handler);
    };
  }, [user]);

  return { loading, refresh: () => refreshStore(user) };
}
