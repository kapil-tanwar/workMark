import { createFileRoute } from "@tanstack/react-router";
import { store, decideLeave, decideCompOffRequest } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock, CheckCircle2, BarChart3, MoreHorizontal, Check, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatLeaveDays } from "@/lib/leave-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin/leaves")({
  head: () => ({ meta: [{ title: "Leave Requests — WorkFlow HR" }] }),
  component: AdminLeaves,
});

function formatDuration(duration) {
  if (duration === "half") return "Half day";
  if (duration === "full") return "Full day";
  const num = parseFloat(duration);
  if (isNaN(num)) return duration || "Full day";
  if (num === 0.5) return "Half day";
  if (num === 1) return "Full day";
  return `${num} days`;
}

/* ── Status Chip ── */
function StatusChip({ status }) {
  const map = {
    Pending:  "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
    Approved: "bg-[rgba(78,222,163,0.15)] text-tertiary",
    Rejected: "bg-[rgba(186,26,26,0.12)] text-destructive",
  };
  const dot = {
    Pending:  "bg-[#4648d4]",
    Approved: "bg-tertiary",
    Rejected: "bg-destructive",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide",
      map[status] ?? "bg-muted text-muted-foreground"
    )}>
      <span className={cn("size-1.5 rounded-full shrink-0", dot[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

const PAGE_SIZE = 10;

function AdminLeaves() {
  useWorkflowRefresh();
  const [section, setSection] = useState("all");   // "all" | "leave" | "compoff"
  const [statusTab, setStatusTab] = useState("All"); // "Pending" | "Approved" | "Rejected" | "All"
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);

  const users = store.getUsers();
  const allLeaves      = store.getLeaves();
  const allCompOff     = store.getCompOffRequests();

  const pendingCount   = allLeaves.filter((l) => l.status === "Pending").length
                       + allCompOff.filter((r) => r.status === "Pending").length;
  const approvedToday  = allLeaves.filter(
    (l) => l.status === "Approved" && l.startDate === new Date().toISOString().slice(0, 10)
  ).length;

  // Build unified list
  const leaveRows    = allLeaves.map((l) => ({ ...l, kind: "leave" }));
  const compoffRows  = allCompOff.map((r) => ({ ...r, kind: "compoff" }));
  const combined     = section === "leave"   ? leaveRows
                     : section === "compoff" ? compoffRows
                     :                         [...leaveRows, ...compoffRows];

  const filtered = combined
    .filter((item) => statusTab === "All" || item.status === statusTab)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleDecide(item, status) {
    setBusy(item.id);
    try {
      if (item.kind === "leave") await decideLeave(item.id, status);
      else await decideCompOffRequest(item.id, status);
      toast.success(`${item.kind === "leave" ? "Leave" : "Comp-off"} ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  function changeSection(s) { setSection(s); setPage(1); }
  function changeStatus(s)  { setStatusTab(s); setPage(1); }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <PageHeader
        title="Leave requests"
        description="Approve or reject leave and comp-off credit requests."
      />

      {/* ── Quick Insights — 2 cols mobile, 3 cols sm+ ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Pending Review */}
        <div className="bg-primary-fixed/30 border border-border/40 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 card-shadow">
          <div className="size-11 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <Clock className="size-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 truncate">Pending Review</p>
            <p className="font-headline text-xl sm:text-2xl font-bold text-foreground">{pendingCount} <span className="text-base font-semibold text-muted-foreground">Requests</span></p>
          </div>
        </div>

        {/* Approved Today */}
        <div className="bg-tertiary-fixed/30 border border-border/40 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 card-shadow">
          <div className="size-11 bg-tertiary rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5 text-on-tertiary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 truncate">Approved Today</p>
            <p className="font-headline text-xl sm:text-2xl font-bold text-foreground">{approvedToday} <span className="text-base font-semibold text-muted-foreground">Employees</span></p>
          </div>
        </div>

        {/* Avg Response Time — full width on 2-col mobile */}
        <div className="bg-secondary-fixed/30 border border-border/40 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 card-shadow col-span-2 sm:col-span-1">
          <div className="size-11 bg-[#4648d4] rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 truncate">Avg Response Time</p>
            <p className="font-headline text-xl sm:text-2xl font-bold text-foreground">2.4 <span className="text-base font-semibold text-muted-foreground">Hours</span></p>
          </div>
        </div>
      </div>

      {/* ── Category tabs (pill segment) ── */}
      <div className="space-y-3">
        <div className="flex items-center bg-muted p-1.5 rounded-2xl w-fit">
          {[
            { value: "all",     label: "All requests" },
            { value: "leave",   label: "Leave" },
            { value: "compoff", label: "Comp-off" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => changeSection(value)}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-xl transition-all",
                section === value
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {["Pending", "Approved", "Rejected", "All"].map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={cn(
                "px-4 py-1.5 text-sm rounded-lg transition-all",
                statusTab === s
                  ? "bg-surface-container-high font-bold text-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Data table card ── */}
      <div className="bg-card rounded-2xl border border-border/40 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                {["Employee", "Type", "Duration", "Date(s)", "Reason", "Status", "Action"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                      h === "Action" && "text-right"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No requests found.
                  </td>
                </tr>
              ) : (
                paged.map((item) => {
                  const u = users.find((x) => x.id === item.userId);
                  const name = item.userName || u?.name || "—";
                  const dept = item.userDepartment || u?.department || "—";

                  const typeLabel = item.kind === "compoff" ? "Comp-off Credit" : item.type;
                  const durationLabel = formatDuration(item.duration);
                  const dateLabel = item.kind === "compoff"
                    ? item.overtimeDate
                    : item.startDate === item.endDate
                      ? item.startDate
                      : `${item.startDate} → ${item.endDate}`;

                  return (
                    <tr
                      key={`${item.kind}-${item.id}`}
                      className="hover:bg-muted/25 transition-colors"
                    >
                      {/* Employee */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-foreground">{name}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{dept}</div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 text-sm text-foreground">{typeLabel}</td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-sm text-foreground">{durationLabel}</td>

                      {/* Date */}
                      <td className="px-6 py-4 font-mono text-[13px] text-muted-foreground">{dateLabel}</td>

                      {/* Reason */}
                      <td className="px-6 py-4 text-sm text-foreground max-w-[180px] truncate">
                        {item.reason || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusChip status={item.status} />
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {item.status === "Pending" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={busy === item.id}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                              >
                                <MoreHorizontal className="size-5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="text-tertiary font-semibold gap-2"
                                onClick={() => handleDecide(item, "Approved")}
                              >
                                <Check className="size-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive font-semibold gap-2"
                                onClick={() => handleDecide(item, "Rejected")}
                              >
                                <X className="size-4" /> Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-6 py-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? "No requests"
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} request${filtered.length !== 1 ? "s" : ""}`}
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
