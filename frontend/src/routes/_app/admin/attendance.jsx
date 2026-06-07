import { createFileRoute } from "@tanstack/react-router";
import { store, totalHours } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/admin/attendance")({
  head: () => ({ meta: [{ title: "Attendance — WorkFlow HR" }] }),
  component: AdminAttendance,
});

function AdminAttendance() {
  useWorkflowRefresh();
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");

  const users = store.getUsers();
  let recs = store.getAttendance().sort((a, b) => (a.date < b.date ? 1 : -1));
  if (date) recs = recs.filter((r) => r.date === date);

  const rows = recs.map((r) => {
    const u = users.find((x) => x.id === r.userId);
    return {
      ...r,
      name: r.userName || u?.name || "—",
      emp: r.userEmployeeId || u?.employeeId || "",
    };
  });

  const filtered = rows.filter(
    (r) => r.name.toLowerCase().includes(q.toLowerCase()) || r.emp.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance Management" description="View attendance across the company." />
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employee…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No records
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 100).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.emp}</div>
                  </TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.checkIn || "—"}</TableCell>
                  <TableCell>{r.checkOut || "—"}</TableCell>
                  <TableCell>{totalHours(r)}</TableCell>
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
  );
}
