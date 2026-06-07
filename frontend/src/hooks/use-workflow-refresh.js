import { useEffect, useState } from "react";
import { refreshStore } from "@/lib/store";

export function useWorkflowRefresh() {
  const [, tick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    refreshStore()
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
  }, []);

  return { loading, refresh: refreshStore };
}
