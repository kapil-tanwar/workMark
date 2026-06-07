import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { store, leaveBalanceWithPending, submitLeave, cancelLeave } from "@/lib/store";
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
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/leave")({
  head: () => ({ meta: [{ title: "Leave Management — WorkFlow HR" }] }),
  component: LeavePage,
});

function LeavePage() {
  const { user } = useAuth();
  useWorkflowRefresh();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Casual Leave");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const leaves = store
    .getLeaves()
    .filter((l) => l.userId === user.id)
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Apply for leave and track your requests."
        actions={
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
                  <Select value={type} onValueChange={(v) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                      <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                      <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Available: {Math.max(0, bal.remainingByType[type] ?? 0)} day(s)
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
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            k: "Casual",
            used: bal.used["Casual Leave"],
            total: bal.allocation.casual,
            remaining: bal.remainingByType["Casual Leave"],
            tone: "bg-info/10 text-info",
          },
          {
            k: "Sick",
            used: bal.used["Sick Leave"],
            total: bal.allocation.sick,
            remaining: bal.remainingByType["Sick Leave"],
            tone: "bg-warning/15 text-warning-foreground",
          },
          {
            k: "Earned",
            used: bal.used["Earned Leave"],
            total: bal.allocation.earned,
            remaining: bal.remainingByType["Earned Leave"],
            tone: "bg-success/10 text-success",
          },
          {
            k: "Total remaining",
            used: bal.remaining,
            total: bal.total,
            remaining: bal.remaining,
            tone: "bg-primary-soft text-primary",
          },
        ].map((c) => (
          <div key={c.k} className={`rounded-xl border border-border p-5 ${c.tone}`}>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-80">{c.k}</div>
            <div className="mt-2 text-3xl font-bold">
              {c.k === "Total remaining" ? c.remaining : `${c.used}`}
              {c.k !== "Total remaining" && <span className="text-base opacity-60"> / {c.total}</span>}
            </div>
            {c.k !== "Total remaining" && (
              <p className="text-xs mt-1 opacity-70">{Math.max(0, c.remaining)} left</p>
            )}
          </div>
        ))}
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
    </div>
  );
}
