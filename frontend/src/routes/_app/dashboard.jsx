import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { store, currentMonthCounts, leaveBalance } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatCard, StatusBadge, Panel, EmptyState } from "@/components/wf-ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { WeekendNotice } from "@/components/attendance/WeekendNotice";
import { todayISO, formatLongDate } from "@/lib/utils/date";
import { formatLeaveDays } from "@/lib/leave-utils";
import { CheckCircle2, XCircle, CalendarDays, Sparkles, Plus, Clock, User as UserIcon, ArrowUpRight, CalendarX2 } from "lucide-react";

const StatusChip = ({ status }) => <StatusBadge status={status} />;

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="num font-headline text-5xl sm:text-6xl font-bold tracking-[-0.06em] leading-none">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

/* Leave balance ring */
function BalanceRing({ used, total }) {
  const pct = total > 0 ? Math.min(1, Math.max(0, used / total)) : 0;
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 88 88" className="size-24 -rotate-90" aria-hidden="true">
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="var(--brand)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
    </svg>
  );
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  useWorkflowRefresh();

  if (!user) return null;

  const today = todayISO();
  const todayRec = store.getAttendance().find((a) => a.userId === user.id && a.date === today);
  const counts = currentMonthCounts(user.id);
  const balance = leaveBalance(user.id);
  const recentLeaves = store.getLeaves().filter((l) => l.userId === user.id).slice(0, 5);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader eyebrow={formatLongDate()} title={`${greeting}, ${user.name.split(" ")[0]}`} description="Here’s your day at a glance." />

      <WeekendNotice />

      {/* ── Today hero ── */}
      <section className="surface relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden="true" className="absolute -top-24 -right-16 size-72 rounded-full bg-brand/15 blur-[80px]" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow mb-4 flex items-center gap-2"><Clock className="size-3.5" /> Today’s status</p>
            <LiveClock />
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <StatusChip status={todayRec?.status ?? "Absent"} />
              {todayRec?.checkIn && (
                <span className="text-sm text-muted-foreground font-mono">
                  In {todayRec.checkIn}{todayRec.checkOut && ` · Out ${todayRec.checkOut}`}
                </span>
              )}
            </div>
          </div>
          <AttendanceActions todayRec={todayRec} className="lg:flex-col xl:flex-row [&>button]:h-12 [&>button]:px-6" />
        </div>
      </section>

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Present days" value={counts.present} hint="This month" icon={CheckCircle2} tone="success" />
        <StatCard label="Absent days" value={counts.absent} hint="This month" icon={XCircle} tone="destructive" />
        <StatCard label="Leaves taken" value={formatLeaveDays(balance.taken)} hint={`of ${formatLeaveDays(balance.total)} total`} icon={CalendarDays} tone="info" />
        <StatCard label="Remaining leaves" value={formatLeaveDays(Math.max(0, balance.totalRemaining))} hint="Earned + comp-off" icon={Sparkles} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recent leave requests */}
        <Panel
          className="lg:col-span-2"
          title="Recent leave requests"
          flush
          action={<Link to="/leave" className="inline-flex items-center gap-1 text-[13px] text-primary font-semibold hover:gap-1.5 transition-all">View all <ArrowUpRight className="size-3.5" /></Link>}
        >
          {recentLeaves.length === 0 ? (
            <EmptyState icon={CalendarX2} title="No leave requests yet" description="When you apply for leave, your requests will appear here." />
          ) : (
            <div className="divide-y divide-hairline">
              {recentLeaves.map((l) => (
                <div key={l.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="size-9 rounded-[10px] bg-muted grid place-items-center text-muted-foreground shrink-0"><CalendarDays className="size-4" /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13.5px] text-foreground truncate">{l.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{l.startDate} → {l.endDate}</p>
                    </div>
                  </div>
                  <StatusChip status={l.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Balance + quick actions */}
        <div className="space-y-4 sm:space-y-5">
          <Panel title="Leave balance">
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <BalanceRing used={balance.taken} total={balance.total} />
                <span className="absolute inset-0 grid place-items-center num font-headline text-lg font-bold tracking-[-0.04em]">
                  {formatLeaveDays(Math.max(0, balance.totalRemaining))}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Days remaining</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {formatLeaveDays(balance.taken)} used of {formatLeaveDays(balance.total)} total
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="Quick actions" bodyClassName="p-3">
            <div className="space-y-1">
              {[
                { to: "/leave", icon: Plus, label: "Apply for leave", primary: true },
                { to: "/attendance", icon: Clock, label: "Attendance history" },
                { to: "/profile", icon: UserIcon, label: "View profile" },
              ].map(({ to, icon: Icon, label, primary }) => (
                <Link key={to} to={to} className="group flex items-center gap-3 px-3 h-11 rounded-[10px] text-sm font-medium hover:bg-muted transition-colors">
                  <span className={`size-7 rounded-lg grid place-items-center ${primary ? "bg-primary-fixed text-on-primary-fixed" : "bg-muted text-muted-foreground"}`}><Icon className="size-3.5" /></span>
                  <span className="flex-1">{label}</span>
                  <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
