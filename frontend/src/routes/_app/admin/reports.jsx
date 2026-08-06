
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Download, FileSpreadsheet, FileText, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

function recordExport(name, fmt) {
  const h = JSON.parse(localStorage.getItem("wf_exports") || "[]");
  h.unshift({ name, fmt, date: new Date().toLocaleString() });
  const sliced = h.slice(0, 50);
  localStorage.setItem("wf_exports", JSON.stringify(sliced));
  return sliced;
}



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

/* Loading-state export button */
function ExportButton({ label, onClick, icon: Icon }) {
  const [state, setState] = useState("idle"); // idle | loading | done

  async function handleClick() {
    setState("loading");
    await new Promise((r) => setTimeout(r, 600));
    onClick();
    setState("done");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-70"
    >
      {state === "loading" ? (
        <>
          <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Processing...
        </>
      ) : state === "done" ? (
        <>✓ Ready</>
      ) : (
        <>
          <Icon className="size-4" />
          {label}
        </>
      )}
    </button>
  );
}

export default function ReportsPage() {
  useWorkflowRefresh();
  const ym = new Date().toISOString().slice(0, 7);
  const users = store.getUsers().filter((u) => u.role === "employee");
  const att = store.getAttendance().filter((a) => a.date.startsWith(ym));
  const leaves = store.getLeaves();

  const [history, setHistory] = useState([]);
  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("wf_exports") || "[]"));
  }, []);

  function exportAttendance() {
    const rows = [["Employee", "Date", "Check In", "Check Out", "Status"]];
    att.forEach((a) => {
      const u = users.find((x) => x.id === a.userId);
      rows.push([a.userName || u?.name || "", a.date, a.checkIn || "", a.checkOut || "", a.status]);
    });
    const filename = `attendance-${ym}.csv`;
    downloadCSV(filename, rows);
    setHistory(recordExport(filename, "CSV"));
    toast.success("Attendance report exported");
  }

  function exportLeaves() {
    const rows = [["Employee", "Type", "Start", "End", "Status", "Reason"]];
    leaves.forEach((l) => {
      const u = users.find((x) => x.id === l.userId);
      rows.push([l.userName || u?.name || "", l.type, l.startDate, l.endDate, l.status, l.reason]);
    });
    const filename = `leaves-${ym}.csv`;
    downloadCSV(filename, rows);
    setHistory(recordExport(filename, "CSV"));
    toast.success("Leave report exported");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Reports" description="Export attendance and leave reports." />

      {/* ── 2-col Report Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Attendance */}
        <div className="group bg-card border border-border/40 rounded-2xl p-6 card-shadow hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="size-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="size-6" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-foreground">Monthly attendance report</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Attendance summary for {ym}.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ExportButton label="Export CSV" icon={Download} onClick={exportAttendance} />
            <button
              onClick={() => toast.info("PDF export coming soon")}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-all"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Monthly Leave */}
        <div className="group bg-card border border-border/40 rounded-2xl p-6 card-shadow hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="size-12 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="size-6" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-foreground">Monthly leave report</h3>
              <p className="text-sm text-muted-foreground mt-0.5">All leave requests with status.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ExportButton label="Export CSV" icon={Download} onClick={exportLeaves} />
            <button
              onClick={() => toast.info("PDF export coming soon")}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-semibold hover:bg-surface-container-high transition-all"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* ── Custom Analytics Banner — full width ── */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden bg-[#4648d4] rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Subtle radial bg overlay */}
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 10% 50%, rgba(255,255,255,0.25) 0%, transparent 60%), radial-gradient(circle at 90% 20%, rgba(183,196,255,0.3) 0%, transparent 50%)"
              }}
            />

            {/* Text */}
            <div className="relative z-10 max-w-xl">
              <h4 className="font-headline text-4xl font-bold text-white mb-2 tracking-tight">Custom Analytics</h4>
              <p className="text-[#cad3ff] text-base leading-relaxed mb-6">
                Need a deeper dive? Create custom reporting pipelines for specific departments or periods.
              </p>
              <button
                onClick={() => toast.info("Custom analytics coming soon")}
                className="px-7 py-3.5 bg-white text-primary font-bold rounded-full text-sm hover:shadow-xl active:scale-95 transition-all"
              >
                Configure Pipeline
              </button>
            </div>

            {/* Large ghost icon */}
            <div className="relative opacity-20 md:opacity-30 select-none pointer-events-none shrink-0">
              <BarChart3 className="size-48 text-white" strokeWidth={0.8} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Export History Table ── */}
      <div className="bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-border/40 flex justify-between items-center">
          <h3 className="font-headline font-bold text-lg text-foreground">Recent Export History</h3>
          <button
            onClick={() => toast.info("Full history coming soon")}
            className="text-primary font-bold text-sm hover:underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            View all history
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Report Name</th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Format</th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date Generated</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No export history available.
                  </td>
                </tr>
              ) : history.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/25 transition-colors group">
                  <td className="px-6 py-4 font-semibold text-sm text-foreground">{row.name}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(78,222,163,0.15)] text-tertiary">
                      {row.fmt}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{row.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toast.info("Re-download coming soon")}
                      className="size-9 rounded-full hover:bg-primary-fixed text-primary transition-all inline-flex items-center justify-center"
                    >
                      <Download className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
