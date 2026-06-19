import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { store, currentMonthCounts, leaveBalance } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { WeekendNotice } from "@/components/attendance/WeekendNotice";
import { todayISO, formatLongDate } from "@/lib/utils/date";
import { formatLeaveDays } from "@/lib/leave-utils";
import { CheckCircle2, XCircle, CalendarDays, Sparkles, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WorkFlow HR" }] }),
  component: EmployeeDashboard,
});

/* Status chip matching the MD3 reference */
function StatusChip({ status }) {
  const map = {
    Present: "bg-[rgba(78,222,163,0.15)] text-tertiary",
    Absent:  "bg-[rgba(186,26,26,0.10)] text-destructive",
    Leave:   "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
    Late:    "bg-[rgba(78,222,163,0.12)] text-tertiary",
  };
  const dot = {
    Present: "bg-tertiary", Absent: "bg-destructive", Leave: "bg-[#4648d4]", Late: "bg-tertiary",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold", map[status] ?? "bg-muted text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full shrink-0", dot[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

/* MD3-style stat tile */
function StatTile({ label, value, hint, icon: Icon, tileClass }) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl p-5 card-shadow flex items-center gap-4">
      <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0", tileClass)}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-headline text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  useWorkflowRefresh();

  if (!user) return null;

  const today = todayISO();
  const todayRec = store.getAttendance().find((a) => a.userId === user.id && a.date === today);
  const counts = currentMonthCounts(user.id);
  const balance = leaveBalance(user.id);
  const recentLeaves = store.getLeaves().filter((l) => l.userId === user.id).slice(0, 5);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]}, welcome back`}
        description={formatLongDate()}
      />

      <WeekendNotice />

      {/* ── Today's attendance card ── */}
      <div className="bg-card border border-border/40 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between card-shadow">
        <div className="flex items-center gap-4 min-w-0">
          <div className="size-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0">
            <Clock className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Today's status</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusChip status={todayRec?.status ?? "Absent"} />
              {todayRec?.checkIn && (
                <span className="text-sm text-muted-foreground font-mono">
                  In {todayRec.checkIn}{todayRec.checkOut && ` · Out ${todayRec.checkOut}`}
                </span>
              )}
            </div>
          </div>
        </div>
        <AttendanceActions todayRec={todayRec} />
      </div>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="Present days"     value={counts.present}                                       hint="This month"               icon={CheckCircle2} tileClass="bg-tertiary-fixed text-tertiary" />
        <StatTile label="Absent days"      value={counts.absent}                                        hint="This month"               icon={XCircle}      tileClass="bg-error-container text-on-error-container" />
        <StatTile label="Leaves taken"     value={formatLeaveDays(balance.taken)}                       hint={`of ${formatLeaveDays(balance.total)} total`} icon={CalendarDays} tileClass="bg-secondary-fixed text-on-secondary-fixed" />
        <StatTile label="Remaining leaves" value={formatLeaveDays(Math.max(0, balance.totalRemaining))} hint="Earned + comp-off"         icon={Sparkles}     tileClass="bg-primary-fixed text-on-primary-fixed" />
      </div>

      {/* ── Bottom grid: recent leaves + quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent leave requests */}
        <div className="lg:col-span-2 bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
            <h3 className="font-headline font-bold text-base text-foreground">Recent leave requests</h3>
            <Link to="/leave" className="text-sm text-primary font-semibold hover:underline underline-offset-2 shrink-0">
              View all
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No leave requests yet</div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentLeaves.map((l) => (
                <div key={l.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/25 transition-colors">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{l.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{l.startDate} → {l.endDate}</p>
                  </div>
                  <StatusChip status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-border/40 rounded-2xl p-5 card-shadow">
          <h3 className="font-headline font-bold text-base text-foreground mb-4">Quick actions</h3>
          <div className="space-y-2">
            <Link
              to="/leave"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary-fixed text-on-primary-fixed font-semibold text-sm hover:opacity-90 transition-all"
            >
              <Plus className="size-4 shrink-0" />
              Apply for leave
            </Link>
            <Link
              to="/attendance"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition-all"
            >
              <Clock className="size-4 shrink-0" />
              Attendance history
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-muted/70 transition-all"
            >
              <span className="size-4 shrink-0 text-center">👤</span>
              View profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
