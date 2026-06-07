import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { store, currentMonthCounts, leaveBalance } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatCard, StatusBadge } from "@/components/wf-ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { WeekendNotice } from "@/components/attendance/WeekendNotice";
import { todayISO, formatLongDate } from "@/lib/utils/date";
import { CheckCircle2, XCircle, CalendarDays, Sparkles, Plus, Clock } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WorkFlow HR" }] }),
  component: EmployeeDashboard,
});

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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]}, welcome back`}
        description={formatLongDate()}
      />

      <WeekendNotice />

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="size-12 sm:size-14 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
            <Clock className="size-6 sm:size-7" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Today's status</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {todayRec ? <StatusBadge status={todayRec.status} /> : <StatusBadge status="Absent" />}
              {todayRec?.checkIn && (
                <span className="text-sm text-muted-foreground">
                  In {todayRec.checkIn}
                  {todayRec.checkOut && ` · Out ${todayRec.checkOut}`}
                </span>
              )}
            </div>
          </div>
        </div>
        <AttendanceActions todayRec={todayRec} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Present days" value={counts.present} hint="This month" icon={CheckCircle2} tone="success" />
        <StatCard label="Absent days" value={counts.absent} hint="This month" icon={XCircle} tone="destructive" />
        <StatCard label="Leaves taken" value={balance.taken} hint={`of ${balance.total} allocated`} icon={CalendarDays} tone="info" />
        <StatCard label="Remaining leaves" value={balance.remaining} hint="Available balance" icon={Sparkles} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl min-w-0">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base">Recent leave requests</h3>
            <Link to="/leave" className="text-xs sm:text-sm text-primary font-medium hover:underline shrink-0">
              View all
            </Link>
          </div>
          {recentLeaves.length === 0 ? (
            <div className="p-8 sm:p-10 text-center text-sm text-muted-foreground">No leave requests yet</div>
          ) : (
            <div className="divide-y divide-border">
              {recentLeaves.map((l) => (
                <div key={l.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{l.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {l.startDate} → {l.endDate}
                    </p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base">Quick actions</h3>
          <div className="mt-4 space-y-2">
            <Link
              to="/leave"
              className="flex items-center w-full px-3 py-3 rounded-lg bg-primary-soft text-primary hover:opacity-90 transition"
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <Plus className="size-4" /> Apply for leave
              </span>
            </Link>
            <Link
              to="/attendance"
              className="flex items-center w-full px-3 py-3 rounded-lg bg-muted hover:bg-muted/70 transition"
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <Clock className="size-4" /> Attendance history
              </span>
            </Link>
            <Link to="/profile" className="flex items-center w-full px-3 py-3 rounded-lg bg-muted hover:bg-muted/70 transition">
              <span className="font-medium text-sm">View profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
