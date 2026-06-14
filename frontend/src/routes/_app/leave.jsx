import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import {
  store,
  leaveBalanceWithPending,
  submitLeave,
  cancelLeave,
  submitCompOffRequest,
  cancelCompOffRequest,
} from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatLeaveDays } from "@/lib/leave-utils";

export const Route = createFileRoute("/_app/leave")({
  head: () => ({ meta: [{ title: "Leave Management — WorkFlow HR" }] }),
  component: LeavePage,
});

function LeavePage() {
  const { user } = useAuth();
  useWorkflowRefresh();
  const [open, setOpen] = useState(false);
  const [compOffOpen, setCompOffOpen] = useState(false);
  const [type, setType] = useState("Earned Leave");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [overtimeDate, setOvertimeDate] = useState("");
  const [overtimeDuration, setOvertimeDuration] = useState("half");
  const [overtimeReason, setOvertimeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [compOffSubmitting, setCompOffSubmitting] = useState(false);

  if (!user) return null;

  const leaves = store
    .getLeaves()
    .filter((l) => l.userId === user.id)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  const compOffRequests = store
    .getCompOffRequests()
    .filter((r) => r.userId === user.id)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  const bal = leaveBalanceWithPending(user.id);

  async function handleSubmit() {
    if (!start || !end || !reason) {
      toast.error("Fill all required fields");
      return;
    }
    if (end < start) {
      toast.error("End date must be on or after start date");
      return;
    }
    setSubmitting(true);
    try {
      await submitLeave({ userId: user.id, type, startDate: start, endDate: end, reason });
      toast.success("Leave request submitted");
      setOpen(false);
      setReason("");
      setStart("");
      setEnd("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompOffSubmit() {
    if (!overtimeDate || !overtimeReason) {
      toast.error("Fill all required fields");
      return;
    }
    setCompOffSubmitting(true);
    try {
      await submitCompOffRequest({
        overtimeDate,
        duration: overtimeDuration,
        reason: overtimeReason,
      });
      toast.success("Comp-off credit request submitted");
      setCompOffOpen(false);
      setOvertimeDate("");
      setOvertimeReason("");
      setOvertimeDuration("half");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompOffSubmitting(false);
    }
  }

  async function handleCancel(id) {
    const lv = leaves.find((l) => l.id === id);
    if (!lv || lv.status !== "Pending") return;
    try {
      await cancelLeave(id);
      toast.success("Request cancelled");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCancelCompOff(id) {
    const req = compOffRequests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;
    try {
      await cancelCompOffRequest(id);
      toast.success("Comp-off request cancelled");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Apply for leave, request comp-off credits for overtime, and track your balance."
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={compOffOpen} onOpenChange={setCompOffOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Clock className="size-4" /> Request comp-off credit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request comp-off credit</DialogTitle>
                  <DialogDescription>
                    Report overtime work. Admin approval adds 0.5 day (half) or 1 day (full) to your comp-off balance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Overtime date</Label>
                    <Input type="date" value={overtimeDate} onChange={(e) => setOvertimeDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Overtime duration</Label>
                    <Select value={overtimeDuration} onValueChange={setOvertimeDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="half">Half day (+0.5 comp-off)</SelectItem>
                        <SelectItem value="full">Full day (+1 comp-off)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reason / details</Label>
                    <Textarea
                      rows={3}
                      placeholder="Describe the overtime work performed"
                      value={overtimeReason}
                      onChange={(e) => setOvertimeReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCompOffOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCompOffSubmit} disabled={compOffSubmitting}>
                    Submit request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Apply for leave
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for leave</DialogTitle>
                  <DialogDescription>Submit a new leave request for approval.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Leave type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                        <SelectItem value="Comp-Off Leave">Comp-Off Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Available: {formatLeaveDays(Math.max(0, bal.remainingByType[type] ?? 0))} day(s)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start date</Label>
                      <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End date</Label>
                      <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reason</Label>
                    <Textarea
                      rows={3}
                      placeholder="Briefly describe the reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    Submit request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border p-5 bg-success/10 text-success">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Earned Leave</div>
          <div className="mt-2 text-3xl font-bold">
            {formatLeaveDays(Math.max(0, bal.earned.remaining))}
            <span className="text-base opacity-60"> / {formatLeaveDays(bal.earned.total)}</span>
          </div>
          <p className="text-xs mt-1 opacity-70">
            {formatLeaveDays(Math.max(0, bal.earned.remaining))} left · +1.5 added on 1st of each month
          </p>
        </div>

        <div className="rounded-xl border border-border p-5 bg-info/10 text-info">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Comp-Off Leave</div>
          <div className="mt-2 text-3xl font-bold">
            {formatLeaveDays(Math.max(0, bal.compOff.remaining))}
            <span className="text-base opacity-60"> / {formatLeaveDays(bal.compOff.total)}</span>
          </div>
          <p className="text-xs mt-1 opacity-70">
            {formatLeaveDays(Math.max(0, bal.compOff.remaining))} comp-off left of {formatLeaveDays(bal.compOff.total)} total
          </p>
        </div>

        <div className="rounded-xl border border-border p-5 bg-primary-soft text-primary">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Leave Balance</div>
          <div className="mt-2 text-3xl font-bold">{formatLeaveDays(Math.max(0, bal.totalRemaining))}</div>
          <p className="text-xs mt-1 opacity-70">Combined earned + comp-off available</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <h3 className="font-semibold text-sm sm:text-base">Leave history</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No leave requests yet
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.type}</TableCell>
                    <TableCell>{l.startDate}</TableCell>
                    <TableCell>{l.endDate}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{l.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {l.status === "Pending" ? (
                        <Button size="sm" variant="ghost" onClick={() => handleCancel(l.id)}>
                          <X className="size-4" /> Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border">
          <h3 className="font-semibold text-sm sm:text-base">Comp-off credit requests</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Overtime date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compOffRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No comp-off requests yet
                  </TableCell>
                </TableRow>
              ) : (
                compOffRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.overtimeDate}</TableCell>
                    <TableCell className="capitalize">{r.duration === "half" ? "Half day" : "Full day"}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{r.reason}</TableCell>
                    <TableCell>
                      {r.status === "Approved" && r.creditAmount != null
                        ? `+${formatLeaveDays(r.creditAmount)}`
                        : r.duration === "half"
                          ? "+0.5"
                          : "+1"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "Pending" ? (
                        <Button size="sm" variant="ghost" onClick={() => handleCancelCompOff(r.id)}>
                          <X className="size-4" /> Cancel
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
