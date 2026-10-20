import { useEffect, useState } from "react";

/** Reactive view of the current theme (the `dark` class on <html>). Used by Three.js scenes. */
export function useTheme() {
  const read = () =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setTheme(read()));
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

export function usePrefersReducedMotion() {
  const q = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}
