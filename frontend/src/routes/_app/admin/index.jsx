import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatCard, StatusBadge } from "@/components/wf-ui";
import { AttendanceChart } from "@/components/admin/AttendanceChart";
import { PendingLeavesPanel } from "@/components/admin/PendingLeavesPanel";
import { computeDailyAttendanceStats, buildWeeklyChartData, getOnLeaveUserIds } from "@/lib/utils/admin-stats";
import { todayISO, lastNDays, isDateInRange } from "@/lib/utils/date";
import { Users, UserCheck, UserX, CalendarOff, FileClock, Phone, Mail, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — WorkFlow HR" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  useWorkflowRefresh();
  const [activeModal, setActiveModal] = useState(null);

  const employees = store.getUsers().filter((u) => u.role === "employee" && u.active !== false);
  const attendance = store.getAttendance();
  const leaves = store.getLeaves();
  const today = todayISO();

  const { present, absent, onLeave } = computeDailyAttendanceStats(employees, leaves, attendance, today);
  const onLeaveIds = getOnLeaveUserIds(employees, leaves, attendance, today);
  const dayRecs = attendance.filter((a) => a.date === today && employees.some(emp => emp.id === a.userId));

  const pendingLeaves = leaves
    .filter((l) => l.status === "Pending")
    .map((l) => ({ ...l, kind: "leave" }));

  const pendingCompOff = store
    .getCompOffRequests()
    .filter((r) => r.status === "Pending")
    .map((r) => ({ ...r, kind: "compoff" }));

  const pending = [...pendingLeaves, ...pendingCompOff].sort((a, b) =>
    (a.appliedAt < b.appliedAt ? 1 : -1)
  );

  const chartData = buildWeeklyChartData(employees, leaves, attendance, lastNDays(7));

  function getUserName(item) {
    const emp = store.getUsers().find((u) => u.id === item.userId);
    return item.userName || emp?.name || "Unknown";
  }

  // Define employee list for popups
  let modalTitle = "";
  let modalDescription = "";
  let modalEmployees = [];

  if (activeModal === "total") {
    modalTitle = "Total Employees";
    modalDescription = "All active team members in the organization.";
    modalEmployees = employees;
  } else if (activeModal === "present") {
    modalTitle = "Present Employees Today";
    modalDescription = "Team members who have checked in today.";
    modalEmployees = employees.filter((emp) => 
      !onLeaveIds.has(emp.id) && 
      dayRecs.some((r) => r.userId === emp.id && (r.status === "Present" || r.status === "Late"))
    );
  } else if (activeModal === "absent") {
    modalTitle = "Absent Employees Today";
    modalDescription = "Team members who are absent today (excluding approved leaves).";
    modalEmployees = employees.filter((emp) => 
      !onLeaveIds.has(emp.id) && 
      !dayRecs.some((r) => r.userId === emp.id && (r.status === "Present" || r.status === "Late"))
    );
  } else if (activeModal === "leave") {
    modalTitle = "On Leave Employees Today";
    modalDescription = "Team members on approved leaves today.";
    modalEmployees = employees.filter((emp) => onLeaveIds.has(emp.id));
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Admin dashboard" description="Workforce overview at a glance." />

      {/* ── Stat Cards — 2 cols mobile, 3 cols tablet, 5 cols desktop ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard label="Total Employees"  value={employees.length} icon={Users}       tone="primary"     onClick={() => setActiveModal("total")} />
        <StatCard label="Present Today"    value={present}          icon={UserCheck}   tone="success"     onClick={() => setActiveModal("present")} />
        <StatCard label="Absent Today"     value={absent}           icon={UserX}       tone="destructive" onClick={() => setActiveModal("absent")} />
        <StatCard label="On Leave"         value={onLeave}          icon={CalendarOff} tone="info"        onClick={() => setActiveModal("leave")} />
        <StatCard label="Pending Requests" value={pending.length}   icon={FileClock}   tone="warning"     className="col-span-2 md:col-span-1" />
      </div>

      {/* ── Chart + Pending Panel — stacks on mobile, 8+4 on desktop ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Attendance chart */}
        <div className="lg:col-span-8 bg-card border border-border/40 rounded-2xl p-5 sm:p-6 card-shadow min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="font-headline text-lg font-bold">
              Attendance overview
              <span className="text-muted-foreground font-normal opacity-60 ml-2 text-sm">· last 7 days</span>
            </h3>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-tertiary inline-block shrink-0" />
                Present
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-destructive inline-block shrink-0" />
                Absent
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                <span className="size-2.5 rounded-sm bg-primary inline-block shrink-0" />
                Leave
              </span>
            </div>
          </div>
          <AttendanceChart data={chartData} />
        </div>

        {/* Pending panel */}
        <div className="lg:col-span-4 bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden"
             style={{ minHeight: 380 }}>
          <PendingLeavesPanel pending={pending} getUserName={getUserName} />
        </div>
      </div>

      {/* Pop-up Dialog for Employee Details */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              {modalTitle} 
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {modalEmployees.length}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {modalDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
            {modalEmployees.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm font-medium">
                No employees found in this category.
              </div>
            ) : (
              modalEmployees.map((emp) => {
                const initials = emp.name
                  ? emp.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "??";

                // Get contextual info
                let contextualNode = null;
                if (activeModal === "present") {
                  const rec = dayRecs.find((r) => r.userId === emp.id);
                  contextualNode = rec ? (
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={rec.status} />
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        In: {rec.checkIn || "—"} · Out: {rec.checkOut || "Active"}
                      </div>
                    </div>
                  ) : null;
                } else if (activeModal === "absent") {
                  contextualNode = (
                    <div className="flex flex-col items-end">
                      <StatusBadge status="Absent" />
                    </div>
                  );
                } else if (activeModal === "leave") {
                  const lv = leaves.find(
                    (l) =>
                      l.status === "Approved" &&
                      l.userId === emp.id &&
                      isDateInRange(today, l.startDate, l.endDate)
                  );
                  contextualNode = lv ? (
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status="Leave" />
                      <div className="text-xs text-muted-foreground font-medium text-right max-w-[180px] truncate" title={lv.reason}>
                        {lv.type}
                      </div>
                      <div className="text-xs text-muted-foreground italic max-w-[180px] truncate" title={lv.reason}>
                        "{lv.reason}"
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <StatusBadge status="Leave" />
                    </div>
                  );
                } else {
                  contextualNode = (
                    <div className="flex flex-col items-end">
                      <StatusBadge status="Active" />
                    </div>
                  );
                }

                return (
                  <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-11 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                          {emp.name}
                          <span className="text-[10px] bg-muted-foreground/15 text-muted-foreground px-1.5 py-0.5 rounded font-mono font-normal">
                            {emp.employeeId}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {emp.designation || "Team Member"} · {emp.department || "IT"}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground/80">
                          {emp.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="size-3 text-muted-foreground/60" /> {emp.phone}
                            </span>
                          )}
                          {emp.email && (
                            <span className="flex items-center gap-0.5">
                              <Mail className="size-3 text-muted-foreground/60" /> {emp.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:self-center">
                      {contextualNode}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
