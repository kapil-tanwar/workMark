import { createFileRoute } from "@tanstack/react-router";
import { store, totalHours } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/attendance")({
  head: () => ({ meta: [{ title: "Attendance Management — WorkFlow HR" }] }),
  component: AdminAttendance,
});

const PAGE_SIZE = 12;

/* ── Status chip matching reference color scheme ── */
function StatusChip({ status }) {
  const map = {
    Present: "bg-[rgba(78,222,163,0.15)] text-tertiary",
    Absent:  "bg-[rgba(186,26,26,0.10)] text-destructive",
    Leave:   "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
    Late:    "bg-[rgba(78,222,163,0.12)] text-tertiary",
  };
  const dot = {
    Present: "bg-tertiary",
    Absent:  "bg-destructive",
    Leave:   "bg-[#4648d4]",
    Late:    "bg-tertiary",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
      map[status] ?? "bg-muted text-muted-foreground"
    )}>
      <span className={cn("size-1.5 rounded-full inline-block shrink-0", dot[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

function AdminAttendance() {
  useWorkflowRefresh();
  const [q, setQ]       = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const users = store.getUsers();
  let recs = store.getAttendance().sort((a, b) => (a.date < b.date ? 1 : -1));
  if (date) recs = recs.filter((r) => r.date === date);

  const rows = recs.map((r) => {
    const u = users.find((x) => x.id === r.userId);
    return { ...r, name: r.userName || u?.name || "—", emp: r.userEmployeeId || u?.employeeId || "" };
  });

  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q.toLowerCase()) ||
      r.emp.toLowerCase().includes(q.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <PageHeader
        title="Attendance Management"
        description="View and monitor employee attendance across the company."
      />

      {/* ── Main bento card ── */}
      <div className="bg-card rounded-2xl border border-border/40 card-shadow overflow-hidden flex flex-col">

        {/* Controls bar */}
        <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employee..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Date picker */}
          <div className="relative">
            <Calendar className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="bg-card border border-border rounded-lg pl-4 pr-10 py-2 text-sm text-foreground min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>

          {/* Filters button */}
          <button
            onClick={() => { setDate(""); setQ(""); setPage(1); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            title="Clear filters"
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </button>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted/50 border-b border-border/40">
                {[
                  { label: "Employee",  cls: "" },
                  { label: "Date",      cls: "" },
                  { label: "Check In",  cls: "text-center" },
                  { label: "Check Out", cls: "text-center" },
                  { label: "Hours",     cls: "text-center" },
                  { label: "Status",    cls: "text-center" },
                ].map(({ label, cls }) => (
                  <th key={label} className={cn(
                    "px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                    cls
                  )}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                paged.map((r) => {
                  const hours = totalHours(r);
                  const hasTime = !!r.checkIn;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/30 transition-all duration-150"
                      style={{ transition: "background-color 0.15s, transform 0.12s, box-shadow 0.12s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px -2px rgba(0,0,0,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-foreground">{r.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground uppercase mt-0.5">{r.emp}</div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-muted-foreground">{r.date}</td>

                      {/* Check In */}
                      <td className="px-6 py-4 text-center">
                        {hasTime
                          ? <span className="font-mono text-sm text-foreground">{r.checkIn}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Check Out */}
                      <td className="px-6 py-4 text-center">
                        {r.checkOut
                          ? <span className="font-mono text-sm text-foreground">{r.checkOut}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Hours */}
                      <td className="px-6 py-4 text-center">
                        {hours && hours !== "—"
                          ? <span className="text-sm font-bold text-foreground">{hours}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Status */}
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

        {/* ── Pagination footer ── */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {filtered.length === 0
              ? "No records"
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
