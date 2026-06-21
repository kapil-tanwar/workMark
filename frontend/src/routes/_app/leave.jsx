import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  store, leaveBalanceWithPending, submitLeave, cancelLeave,
  submitCompOffRequest, cancelCompOffRequest,
} from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import {
  Plus, X, Clock, CalendarDays, AlarmClock, FileText, Info, Loader2, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatLeaveDays, leaveRequestDays } from "@/lib/leave-utils";
import { cn } from "@/lib/utils"; // used in StatusChip

/* ── Theme-aware modal wrapper ── */
function DarkModal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border bg-card border-border shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b flex justify-between items-start bg-muted/20 border-border">
          <div>
            <h2 className="font-headline text-lg font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm mt-0.5 text-muted-foreground">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        {/* Body */}
        <div className="px-7 py-6 space-y-5 text-foreground">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-7 py-5 border-t flex items-center justify-end gap-3 border-border bg-muted/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Theme-aware input field ── */
function DField({ icon: Icon, type = "text", value, onChange, placeholder, className = "", children, ...rest }) {
  const [focused, setFocused] = useState(false);
  if (children) {
    return (
      <div className={`relative ${className}`}>
        <select {...rest} value={value} onChange={onChange}
          className="w-full h-12 pl-4 pr-10 rounded-xl text-sm border outline-none transition-all appearance-none bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        >{children}</select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none text-muted-foreground" />
      </div>
    );
  }
  if (type === "textarea") {
    return (
      <div className={`relative ${className}`}>
        <Icon className={cn("absolute left-3.5 top-3.5 size-4 pointer-events-none z-10 transition-colors", focused ? "text-primary" : "text-muted-foreground")} />
        <textarea {...rest} value={value} onChange={onChange} placeholder={placeholder} rows={3}
          className="w-full pt-3 pl-10 pr-4 pb-3 rounded-xl text-sm border outline-none transition-all resize-none bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
      </div>
    );
  }
  return (
    <div className={`relative ${className}`}>
      <Icon className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none z-10 transition-colors", focused ? "text-primary" : "text-muted-foreground")} />
      <input {...rest} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-12 pl-10 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </div>
  );
}

export const Route = createFileRoute("/_app/leave")({
  head: () => ({ meta: [{ title: "Leave Management — WorkFlow HR" }] }),
  component: LeavePage,
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

/* MD3 status chip */
function StatusChip({ status }) {
  const map = {
    Present: "bg-[rgba(78,222,163,0.15)] text-tertiary",
    Approved: "bg-[rgba(78,222,163,0.15)] text-tertiary",
    Pending: "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
    Rejected: "bg-[rgba(186,26,26,0.10)] text-destructive",
    Leave: "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
  };
  const dot = {
    Approved: "bg-tertiary", Present: "bg-tertiary",
    Pending: "bg-[#4648d4]", Leave: "bg-[#4648d4]",
    Rejected: "bg-destructive",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold", map[status] ?? "bg-muted text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full shrink-0", dot[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

function LeavePage() {
  const { user } = useAuth();
  useWorkflowRefresh();
  const [open, setOpen] = useState(false);
  const [compOffOpen, setCompOffOpen] = useState(false);
  const [type, setType] = useState("Earned Leave");
  const [leaveDuration, setLeaveDuration] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeDuration, setOvertimeDuration] = useState("half");
  const [overtimeReason, setOvertimeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [compOffSubmitting, setCompOffSubmitting] = useState(false);

  if (!user) return null;

  const leaves = store.getLeaves().filter((l) => l.userId === user.id).sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
  const compOffRequests = store.getCompOffRequests().filter((r) => r.userId === user.id).sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
  const bal = leaveBalanceWithPending(user.id);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStart(val);
    if (val && end && val <= end) setLeaveDuration(leaveRequestDays(val, end, "full"));
  };
  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEnd(val);
    if (start && val && start <= val) setLeaveDuration(leaveRequestDays(start, val, "full"));
  };

  async function handleSubmit() {
    if (!start || !end || !reason) { toast.error("Fill all required fields"); return; }
    if (end < start) { toast.error("End date must be on or after start date"); return; }
    if (leaveDuration === 0.5 && start !== end) { toast.error("Half-day leave must be for a single date"); return; }
    setSubmitting(true);
    try {
      await submitLeave({ userId: user.id, type, startDate: start, endDate: leaveDuration === 0.5 ? start : end, duration: String(leaveDuration), reason });
      toast.success("Leave request submitted");
      setOpen(false); setReason(""); setStart(""); setEnd(""); setLeaveDuration(1);
    } catch (err) { toast.error(err.message); } finally { setSubmitting(false); }
  }

  async function handleCompOffSubmit() {
    if (!overtimeDate || !overtimeReason) { toast.error("Fill all required fields"); return; }
    setCompOffSubmitting(true);
    try {
      await submitCompOffRequest({ overtimeDate, duration: overtimeDuration, reason: overtimeReason });
      toast.success("Comp-off credit request submitted");
      setCompOffOpen(false); setOvertimeDate(""); setOvertimeReason(""); setOvertimeDuration("half");
    } catch (err) { toast.error(err.message); } finally { setCompOffSubmitting(false); }
  }

  async function handleCancel(id) {
    const lv = leaves.find((l) => l.id === id);
    if (!lv || lv.status !== "Pending") return;
    try { await cancelLeave(id); toast.success("Request cancelled"); } catch (err) { toast.error(err.message); }
  }

  async function handleCancelCompOff(id) {
    const req = compOffRequests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;
    try { await cancelCompOffRequest(id); toast.success("Comp-off request cancelled"); } catch (err) { toast.error(err.message); }
  }

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Comp-off Modal ── */}
      <DarkModal
        open={compOffOpen} onClose={() => setCompOffOpen(false)}
        title="Request comp-off credit"
        subtitle="Submit overtime details for credit approval"
        footer={
          <>
            <button type="button" onClick={() => setCompOffOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
            <button type="button" onClick={handleCompOffSubmit} disabled={compOffSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 hover:opacity-90 disabled:opacity-60 bg-primary text-primary-foreground cursor-pointer">
              {compOffSubmitting && <Loader2 className="size-4 animate-spin" />}
              Submit request
            </button>
          </>
        }
      >
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Overtime date</label>
          <DField icon={CalendarDays} type="date" value={overtimeDate} onChange={(e) => setOvertimeDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Overtime duration</label>
          <DField icon={AlarmClock} value={overtimeDuration} onChange={(e) => setOvertimeDuration(e.target.value)}>
            <option value="half">Half Day (+0.5 comp-off)</option>
            <option value="full">Full Day (+1 comp-off)</option>
          </DField>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Reason / details</label>
          <DField icon={FileText} type="textarea" placeholder="e.g. Project X deadline, Critical server maintenance..."
            value={overtimeReason} onChange={(e) => setOvertimeReason(e.target.value)} />
        </div>
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm bg-primary/5 border-primary/20 text-muted-foreground">
          <Info className="size-4 mt-0.5 shrink-0 text-primary" />
          <span>Credits are subject to manager approval based on verified logs. Standard processing time is 1–2 business days.</span>
        </div>
      </DarkModal>

      {/* ── Apply for Leave Modal ── */}
      <DarkModal
        open={open} onClose={() => setOpen(false)}
        title="Request Time Off"
        subtitle="Submit your request for review. Your manager will be notified instantly."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer">Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 hover:opacity-90 disabled:opacity-60 bg-primary text-primary-foreground cursor-pointer">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit Request
            </button>
          </>
        }
      >
        {/* Leave type */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Leave type</label>
          <DField icon={CalendarDays} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="Earned Leave">Earned Leave</option>
            <option value="Comp-Off Leave">Comp-Off Leave</option>
          </DField>
          <p className="text-[11px] mt-1 text-muted-foreground">
            Available: {formatLeaveDays(bal.remainingByType[type] ?? 0)} day(s)
          </p>
        </div>

        {/* Duration stepper */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Duration (days)</label>
          <div className="flex items-center gap-3">
            <button type="button"
              className="size-10 rounded-xl border text-lg font-bold flex items-center justify-center transition-all hover:bg-muted active:scale-95 border-border bg-background text-foreground cursor-pointer"
              disabled={leaveDuration <= 0.5}
              onClick={() => { const n = Math.max(0.5, leaveDuration - 0.5); setLeaveDuration(n); if (n === 0.5 && start) setEnd(start); }}
            >−</button>
            <input type="number" step="0.5" min="0.5"
              className="flex-1 h-10 text-center rounded-xl border text-lg font-bold outline-none bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              value={leaveDuration}
              onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) { setLeaveDuration(v); if (v === 0.5 && start) setEnd(start); } }}
            />
            <button type="button"
              className="size-10 rounded-xl border text-lg font-bold flex items-center justify-center transition-all hover:bg-muted active:scale-95 border-border bg-background text-foreground cursor-pointer"
              onClick={() => setLeaveDuration(leaveDuration + 0.5)}
            >+</button>
          </div>
        </div>

        {/* Dates */}
        {leaveDuration === 0.5 ? (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Date</label>
            <DField icon={CalendarDays} type="date" value={start}
              onChange={(e) => { setStart(e.target.value); setEnd(e.target.value); }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Start date</label>
              <DField icon={CalendarDays} type="date" value={start} onChange={handleStartDateChange} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">End date</label>
              <DField icon={CalendarDays} type="date" value={end} onChange={handleEndDateChange} />
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Reason / Notes</label>
          <DField icon={FileText} type="textarea" placeholder="Provide a brief explanation for your request..."
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </DarkModal>

      {/* ── Header with side-by-side buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0">
        <div className="min-w-0">
          <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Leave Management</h2>
          <p className="text-sm text-muted-foreground mt-1.5">Apply for leave, request comp-off credits, and track your balance.</p>
        </div>
        {/* Buttons — always side by side, wrap gracefully */}
        <div className="flex flex-row gap-2 shrink-0 flex-wrap  px-2 py-4 rounded-xl">
          <button
            onClick={() => setCompOffOpen(true)}
            className="flex items-center gap-2 border border-border/60 bg-card text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted active:scale-95 transition-all whitespace-nowrap"
          >
            <Clock className="size-4 shrink-0" />
            <span>Request comp-off</span>
          </button>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
          >
            <Plus className="size-4 shrink-0" />
            <span>Apply for leave</span>
          </button>
        </div>
      </div>

      {/* ── Balance tiles — 2-col on mobile, 3-col on sm+ ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Earned Leave */}
        <div className="rounded-2xl border border-border/40 p-4 sm:p-5 bg-tertiary-fixed/30 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-tertiary">Earned Leave</div>
          <div className="mt-2 text-3xl font-bold text-tertiary font-headline">{formatLeaveDays(bal.earned.remaining)}</div>
          <p className="text-[11px] mt-1 text-tertiary opacity-80">{formatLeaveDays(bal.earned.remaining)} left · +1.5 added on 1st of each month</p>
        </div>

        {/* Comp-Off Leave */}
        <div className="rounded-2xl border border-border/40 p-4 sm:p-5 bg-secondary-fixed/30 card-shadow">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#4648d4]">Comp-Off Leave</div>
          <div className="mt-2 text-3xl font-bold text-[#4648d4] font-headline">{formatLeaveDays(bal.compOff.remaining)}</div>
          <p className="text-[11px] mt-1 text-[#4648d4] opacity-80">{formatLeaveDays(bal.compOff.remaining)} comp-off left</p>
        </div>

        {/* Total Leave Balance — full width on 2-col mobile */}
        <div className="rounded-2xl border border-border/40 p-4 sm:p-5 bg-primary-fixed/30 card-shadow col-span-2 sm:col-span-1 ">
          <div className="text-[11px] font-bold uppercase tracking-wider text-on-primary-fixed dark:text-white opacity-80">Total Leave Balance</div>
          <div className="mt-2 text-3xl font-bold text-on-primary-fixed dark:text-white opacity-80 font-headline">{formatLeaveDays(bal.totalRemaining)}</div>
          <p className="text-[11px] mt-1 text-on-primary-fixed dark:text-white opacity-80">Combined earned + comp-off available</p>
        </div>
      </div>

      {/* ── Leave History Table ── */}
      <div className="bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="font-headline font-bold text-base text-foreground">Leave history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                {["Type", "Duration", "Start", "End", "Reason", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {leaves.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-sm text-muted-foreground">No leave requests yet</td></tr>
              ) : leaves.map((l) => (
                <tr key={l.id} className="hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-sm text-foreground whitespace-nowrap">{l.type}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground whitespace-nowrap">{formatDuration(l.duration)}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground whitespace-nowrap">{l.startDate}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground whitespace-nowrap">{l.endDate}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-[180px] truncate">{l.reason}</td>
                  <td className="px-5 py-3.5"><StatusChip status={l.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    {l.status === "Pending" ? (
                      <button onClick={() => handleCancel(l.id)} className="flex items-center gap-1 text-destructive text-xs font-semibold hover:underline ml-auto">
                        <X className="size-3.5" /> Cancel
                      </button>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comp-off Requests Table ── */}
      <div className="bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40">
          <h3 className="font-headline font-bold text-base text-foreground">Comp-off credit requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                {["Overtime Date", "Duration", "Reason", "Credit", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {compOffRequests.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">No comp-off requests yet</td></tr>
              ) : compOffRequests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-mono text-foreground whitespace-nowrap">{r.overtimeDate}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground whitespace-nowrap">{r.duration === "half" ? "Half day" : "Full day"}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-[200px] truncate">{r.reason}</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-tertiary">
                    {r.status === "Approved" && r.creditAmount != null ? `+${formatLeaveDays(r.creditAmount)}` : r.duration === "half" ? "+0.5" : "+1"}
                  </td>
                  <td className="px-5 py-3.5"><StatusChip status={r.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    {r.status === "Pending" ? (
                      <button onClick={() => handleCancelCompOff(r.id)} className="flex items-center gap-1 text-destructive text-xs font-semibold hover:underline ml-auto">
                        <X className="size-3.5" /> Cancel
                      </button>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
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
