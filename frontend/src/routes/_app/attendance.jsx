import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { store, totalHours } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { AttendanceActions } from "@/components/attendance/AttendanceActions";
import { WeekendNotice } from "@/components/attendance/WeekendNotice";
import { todayISO } from "@/lib/utils/date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — WorkFlow HR" }] }),
  component: AttendancePage,
});

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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Attendance"
        description="Your check-in and check-out history."
        actions={<AttendanceActions todayRec={todayRec} />}
      />

      <WeekendNotice />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead className="hidden sm:table-cell">Total Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No attendance records yet
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium whitespace-nowrap">{r.date}</TableCell>
                    <TableCell>{r.checkIn || "—"}</TableCell>
                    <TableCell>{r.checkOut || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{totalHours(r)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
