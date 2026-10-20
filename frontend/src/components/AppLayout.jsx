import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import {
  LayoutDashboard, Clock, CalendarDays, User as UserIcon,
  Users, ClipboardCheck, FileBarChart, Settings, LogOut,
  Menu, X, Sparkles, ChevronsUpDown,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandMark";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AiChat } from "@/components/AiChat";

const employeeNav = [
  { to: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { to: "/attendance", label: "Attendance",      icon: Clock },
  { to: "/leave",      label: "Leave Requests",  icon: CalendarDays },
  { to: "/profile",    label: "Profile",         icon: UserIcon },
];

const adminNav = [
  { to: "/admin",             label: "Dashboard",      icon: LayoutDashboard },
  { to: "/admin/employees",   label: "Employees",      icon: Users },
  { to: "/admin/attendance",  label: "Attendance",     icon: Clock },
  { to: "/admin/leaves",      label: "Leave Requests", icon: ClipboardCheck },
  { to: "/admin/reports",     label: "Reports",        icon: FileBarChart },
  { to: "/admin/settings",    label: "Settings",       icon: Settings },
];

export function AppLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname: path } = useLocation();
  const [open, setOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  useWorkflowRefresh();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
    if (!loading && user) {
      const isAdmin = user.role === "admin";
      if (isAdmin && !path.startsWith("/admin")) {
        logout();
        navigate("/admin/login");
      } else if (!isAdmin && path.startsWith("/admin")) {
        logout();
        navigate("/login");
      }
    }
  }, [user, loading, navigate, path, logout]);

  const isUnauthorized = user && (
    (user.role === "admin" && !path.startsWith("/admin")) ||
    (user.role !== "admin" && path.startsWith("/admin"))
  );

  if (!user || isUnauthorized) return null;

  const nav = user.role === "admin" ? adminNav : employeeNav;
  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const isActive = (to) =>
    to === "/admin" ? path === "/admin" : to === "/dashboard" ? path === "/dashboard" : path.startsWith(to);
  const current = nav.find((n) => isActive(n.to));
  const groupLabel = user.role === "admin" ? "Administration" : "Workspace";

  return (
    <div className="h-screen bg-background flex w-full overflow-hidden relative">
      <div aria-hidden="true" className="ambient pointer-events-none absolute inset-0 z-0" />

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[256px] bg-sidebar h-screen",
        "border-r border-sidebar-border flex-col px-3 py-4 transition-transform duration-300 ease-out",
        open ? "flex translate-x-0 shadow-2xl" : "hidden lg:flex -translate-x-full lg:translate-x-0"
      )}>
        <Link to={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="px-2 pt-1 pb-5 block w-fit">
          <BrandLockup sub={`${user.role} portal`} />
        </Link>

        <p className="eyebrow !text-[9.5px] px-3 mb-2">{groupLabel}</p>
        <nav className="flex-1 space-y-0.5 overflow-y-auto" aria-label="Primary">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 h-10 px-3 rounded-[10px] transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[var(--shadow-sm)] ring-1 ring-border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground font-medium"
                )}
              >
                {active && <span aria-hidden="true" className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-brand" />}
                <Icon className={cn("size-[17px] shrink-0 transition-colors", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="text-[13.5px] tracking-[-0.01em]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="pt-3 mt-3 border-t border-sidebar-border space-y-1">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary-fixed text-on-primary-fixed text-xs font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize mt-0.5">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-full flex items-center gap-3 h-9 px-3 rounded-[10px] text-muted-foreground hover:bg-error-container hover:text-on-error-container transition-colors duration-150"
          >
            <LogOut className="size-[16px] shrink-0" />
            <span className="text-[13px] font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[256px] h-screen overflow-hidden relative z-10">
        <header className="glass shrink-0 w-full h-14 border-b border-border flex justify-between items-center px-4 sm:px-8 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden size-9 -ml-1 grid place-items-center rounded-lg hover:bg-muted transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[13px] min-w-0">
              <span className="text-muted-foreground">{groupLabel}</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-semibold truncate">{current?.label ?? "Overview"}</span>
            </div>
            <span className="sm:hidden font-headline font-semibold tracking-[-0.02em] truncate">{current?.label ?? "WorkMark"}</span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 h-9 pl-1 pr-2 ml-1 rounded-full border border-border bg-card/70 hover:bg-muted transition-colors" aria-label="Account menu">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[13px] font-medium max-w-[110px] truncate">{user.name.split(" ")[0]}</span>
                  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{user.email || user.phone || user.employeeId}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "employee" && (
                  <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-[1320px] w-full mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Assistant launcher (Employees only) */}
      {user.role === "employee" && (
        <>
          {!isAiChatOpen && (
            <button
              onClick={() => setIsAiChatOpen(true)}
              className="btn-glow fixed bottom-6 right-6 h-12 pl-4 pr-5 rounded-full hover:-translate-y-0.5 active:scale-95 transition-all z-[60] flex items-center gap-2.5 group"
              title="Ask HR Assistant"
              aria-label="Open HR assistant"
            >
              <Sparkles className="size-[18px] group-hover:rotate-12 transition-transform" />
              <span className="text-sm font-semibold tracking-[-0.01em]">Ask AI</span>
            </button>
          )}
          <AiChat isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} />
        </>
      )}
    </div>
  );
}
