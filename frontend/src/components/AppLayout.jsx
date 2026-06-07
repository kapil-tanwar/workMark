import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, Clock, CalendarDays, User as UserIcon, Users, ClipboardCheck, FileBarChart, Settings, LogOut, Search, Menu, X, Briefcase, } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
const employeeNav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/attendance", label: "Attendance", icon: Clock },
    { to: "/leave", label: "Leave Management", icon: CalendarDays },
    { to: "/profile", label: "Profile", icon: UserIcon },
];
const adminNav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/employees", label: "Employees", icon: Users },
    { to: "/admin/attendance", label: "Attendance", icon: Clock },
    { to: "/admin/leaves", label: "Leave Requests", icon: ClipboardCheck },
    { to: "/admin/reports", label: "Reports", icon: FileBarChart },
    { to: "/admin/settings", label: "Settings", icon: Settings },
];
export function AppLayout() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();
    const path = useRouterState({ select: (s) => s.location.pathname });
    const [open, setOpen] = useState(false);
    useWorkflowRefresh();
    useEffect(() => {
        if (!loading && !user)
            navigate({ to: "/login" });
    }, [user, loading, navigate]);
    if (!user)
        return null;
    const nav = user.role === "admin" ? adminNav : employeeNav;
    return (<div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <aside className={cn("fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border flex-col transition-transform", open ? "flex translate-x-0" : "hidden lg:flex -translate-x-full lg:translate-x-0")}>
        <div className="h-16 px-6 flex items-center gap-2 border-b border-sidebar-border">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Briefcase className="size-5"/>
          </div>
          <div>
            <div className="font-bold text-sidebar-foreground leading-none">WorkFlow HR</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">{user.role} portal</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.to === "/admin"
                ? path === "/admin"
                : item.to === "/dashboard"
                    ? path === "/dashboard"
                    : path.startsWith(item.to);
            return (<Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60")}>
                <Icon className="size-4"/>
                {item.label}
              </Link>);
        })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => {
            logout();
            navigate({ to: "/login" });
        }} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/60 transition-colors">
            <LogOut className="size-4"/>
            Sign out
          </button>
        </div>
      </aside>

      {open && (<div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)}/>)}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border px-4 lg:px-8 flex items-center gap-4 sticky top-0 z-20">
          <button className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X className="size-5"/> : <Menu className="size-5"/>}
          </button>
          <div className="relative max-w-md flex-1 hidden sm:block">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search…" className="pl-9 bg-muted/40 border-transparent focus-visible:border-input"/>
          </div>
          <div className="flex-1 sm:hidden"/>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {user.name
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start mr-2">
                  <span className="text-sm font-medium leading-none">{user.name}</span>
                  <Badge variant="secondary" className="mt-1 h-4 text-[10px] capitalize px-1.5">
                    {user.role}
                  </Badge>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === "employee" && (<DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>)}
              <DropdownMenuItem onClick={() => {
            logout();
            navigate({ to: "/login" });
        }}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-8 max-w-[1400px] w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>);
}
