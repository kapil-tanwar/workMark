import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wf_theme";

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.classList.toggle("dark", theme === "dark");
  window.setTimeout(() => root.classList.remove("theme-switching"), 60);
}

export function ThemeToggle({ className }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    let stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    applyTheme(next);
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative size-9 grid place-items-center rounded-full border border-border bg-card/70 text-muted-foreground",
        "hover:text-foreground hover:bg-muted hover:border-input active:scale-95 transition-all duration-200",
        className
      )}
    >
      <Sun className={cn("absolute size-4 transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} />
      <Moon className={cn("absolute size-4 transition-all duration-300", isDark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} />
    </button>
  );
}
