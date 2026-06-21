import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  LayoutDashboard, Clock, CalendarDays, User as UserIcon,
  Users, ClipboardCheck, FileBarChart, Settings, LogOut,
  Search, Menu, X, Briefcase,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useWorkflowRefresh();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (!user) return null;

  const nav = user.role === "admin" ? adminNav : employeeNav;
  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="h-screen bg-background flex w-full overflow-hidden">

      {/* ── Sidebar — always fixed on desktop, full height, never scrolls with content ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[260px] bg-sidebar h-screen",
        "border-r border-sidebar-border flex-col py-6 px-4 transition-transform duration-300",
        open ? "flex translate-x-0" : "hidden lg:flex -translate-x-full lg:translate-x-0"
      )}>

        {/* Logo */}
        <div className="mb-6 px-2">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Briefcase className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-headline text-base font-bold text-primary leading-tight">WorkFlow HR</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
                {user.role} Portal
              </p>
            </div>
          </div>
        </div>

        {/* Nav — scrollable if many items */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/admin"
              ? path === "/admin"
              : item.to === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-150",
                  active
                    ? "bg-primary-fixed text-on-primary-fixed font-bold"
                    : "text-sidebar-foreground hover:bg-surface-container-high font-semibold"
                )}
              >
                <Icon className={cn("size-[18px] shrink-0", active && "")} />
                <span className="uppercase text-[11px] tracking-wider font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="pt-4 border-t border-sidebar-border">
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-error-container hover:text-on-error-container transition-all duration-150"
          >
            <LogOut className="size-[18px] shrink-0" />
            <span className="uppercase text-[11px] tracking-wider font-bold">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── Main — offset by sidebar width on desktop, scrollable ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[260px] h-screen overflow-hidden">

        {/* Topbar — sticky at top of the scrollable content column */}
        <header className="shrink-0 w-full h-16 bg-card border-b border-border flex justify-between items-center px-4 sm:px-8 z-20">

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* Search */}
          <div className="flex items-center gap-4 flex-1 max-w-sm hidden sm:flex">
            {/* <div className="relative w-full">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="w-full bg-muted border-none rounded-full pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                placeholder="Search..."
                type="text"
              />
            </div> */}
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Right section: theme + user */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* User info */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l border-border hover:opacity-80 transition-opacity">
                  <div className="text-right hidden sm:block">
                    <p className="font-bold text-sm leading-tight">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 capitalize">{user.role}</p>
                  </div>
                  <Avatar className="size-9 border-2 border-primary-fixed">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{user.email || user.phone || user.employeeId}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "employee" && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => { logout(); navigate({ to: "/login" }); }}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content — this div scrolls, sidebar stays fixed */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] w-full mx-auto min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
