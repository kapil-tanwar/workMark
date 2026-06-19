import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { store, totalHours } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { WeekendNotice } from "@/components/attendance/WeekendNotice";
import { todayISO } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — WorkFlow HR" }] }),
  component: AttendancePage,
});

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

function AttendancePage() {
  const { user } = useAuth();
  useWorkflowRefresh();

  if (!user) return null;

  const today = todayISO();
  const records = store
    .getAttendance()
    .filter((a) => a.userId === user.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const todayRec = records.find((r) => r.date === today);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Attendance"
        description="Your check-in and check-out history."
        actions={<AttendanceActions todayRec={todayRec} />}
      />

      <WeekendNotice />

      {/* ── Bento table card ── */}
      <div className="bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                {[
                  { label: "Date",        cls: "" },
                  { label: "Check In",    cls: "text-center" },
                  { label: "Check Out",   cls: "text-center" },
                  { label: "Total Hours", cls: "text-center hidden sm:table-cell" },
                  { label: "Status",      cls: "text-center" },
                ].map(({ label, cls }) => (
                  <th key={label} className={cn("px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground", cls)}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No attendance records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const hours = totalHours(r);
                  return (
                    <tr key={r.id} className="hover:bg-muted/25 transition-colors">
                      <td className="px-6 py-4 font-medium text-sm text-foreground whitespace-nowrap">{r.date}</td>
                      <td className="px-6 py-4 text-center">
                        {r.checkIn
                          ? <span className="font-mono text-sm text-foreground">{r.checkIn}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {r.checkOut
                          ? <span className="font-mono text-sm text-foreground">{r.checkOut}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center hidden sm:table-cell">
                        {hours && hours !== "—"
                          ? <span className="text-sm font-bold text-foreground">{hours}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusChip status={r.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
