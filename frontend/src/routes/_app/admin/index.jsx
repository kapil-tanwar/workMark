import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatCard } from "@/components/wf-ui";
import { AttendanceChart } from "@/components/admin/AttendanceChart";
import { PendingLeavesPanel } from "@/components/admin/PendingLeavesPanel";
import { computeDailyAttendanceStats, buildWeeklyChartData } from "@/lib/utils/admin-stats";
import { todayISO, lastNDays } from "@/lib/utils/date";
import { Users, UserCheck, UserX, CalendarOff, FileClock } from "lucide-react";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — WorkFlow HR" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  useWorkflowRefresh();

  const employees = store.getUsers().filter((u) => u.role === "employee" && u.active !== false);
  const attendance = store.getAttendance();
  const leaves = store.getLeaves();
  const today = todayISO();

  const { present, absent, onLeave } = computeDailyAttendanceStats(employees, leaves, attendance, today);
  const pending = leaves.filter((l) => l.status === "Pending");
  const chartData = buildWeeklyChartData(employees, leaves, attendance, lastNDays(7));

  function getUserName(l) {
    const emp = store.getUsers().find((u) => u.id === l.userId);
    return l.userName || emp?.name || "Unknown";
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Admin dashboard" description="Workforce overview at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total employees" value={employees.length} icon={Users} tone="primary" />
        <StatCard label="Present today" value={present} icon={UserCheck} tone="success" />
        <StatCard label="Absent today" value={absent} icon={UserX} tone="destructive" />
        <StatCard label="On leave" value={onLeave} icon={CalendarOff} tone="info" />
        <StatCard label="Pending leaves" value={pending.length} icon={FileClock} tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base mb-4">Attendance overview · last 7 days</h3>
          <AttendanceChart data={chartData} />
        </div>
        <PendingLeavesPanel pending={pending} getUserName={getUserName} />
      </div>
    </div>
  );
}
