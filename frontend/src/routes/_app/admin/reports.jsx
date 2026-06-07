import { createFileRoute } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — WorkFlow HR" }] }),
  component: ReportsPage,
});

function downloadCSV(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  useWorkflowRefresh();
  const ym = new Date().toISOString().slice(0, 7);
  const users = store.getUsers().filter((u) => u.role === "employee");
  const att = store.getAttendance().filter((a) => a.date.startsWith(ym));
  const leaves = store.getLeaves();

  function exportAttendance() {
    const rows = [["Employee", "Date", "Check In", "Check Out", "Status"]];
    att.forEach((a) => {
      const u = users.find((x) => x.id === a.userId);
      rows.push([a.userName || u?.name || "", a.date, a.checkIn || "", a.checkOut || "", a.status]);
    });
    downloadCSV(`attendance-${ym}.csv`, rows);
    toast.success("Attendance exported");
  }

  function exportLeaves() {
    const rows = [["Employee", "Type", "Start", "End", "Status", "Reason"]];
    leaves.forEach((l) => {
      const u = users.find((x) => x.id === l.userId);
      rows.push([l.userName || u?.name || "", l.type, l.startDate, l.endDate, l.status, l.reason]);
    });
    downloadCSV(`leaves-${ym}.csv`, rows);
    toast.success("Leaves exported");
  }

  const reports = [
    {
      title: "Monthly attendance report",
      desc: `Attendance summary for ${ym}.`,
      icon: FileSpreadsheet,
      action: exportAttendance,
    },
    {
      title: "Monthly leave report",
      desc: "All leave requests with status.",
      icon: FileText,
      action: exportLeaves,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Export attendance and leave reports." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.title} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <Icon className="size-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                  <div className="mt-4 flex gap-2">
                    <Button onClick={r.action}>
                      <Download className="size-4" /> Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => toast.info("PDF export coming soon")}>
                      Export PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
