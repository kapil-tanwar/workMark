import { createFileRoute } from "@tanstack/react-router";
import { store, decideLeave, decideCompOffRequest } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatLeaveDays } from "@/lib/leave-utils";

export const Route = createFileRoute("/_app/admin/leaves")({
  head: () => ({ meta: [{ title: "Leave Requests — WorkFlow HR" }] }),
  component: AdminLeaves,
});

function AdminLeaves() {
  useWorkflowRefresh();
  const [section, setSection] = useState("leave");
  const [tab, setTab] = useState("Pending");
  const [busy, setBusy] = useState(null);

  const users = store.getUsers();
  const leaves = store
    .getLeaves()
    .filter((l) => tab === "All" || l.status === tab)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  const compOffRequests = store
    .getCompOffRequests()
    .filter((r) => tab === "All" || r.status === tab)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  async function handleDecideLeave(id, status) {
    setBusy(id);
    try {
      await decideLeave(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleDecideCompOff(id, status) {
    setBusy(id);
    try {
      await decideCompOffRequest(id, status);
      toast.success(`Comp-off request ${status.toLowerCase()}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leave requests" description="Approve or reject leave and comp-off credit requests." />

      <Tabs value={section} onValueChange={setSection}>
        <TabsList>
          <TabsTrigger value="leave">Leave requests</TabsTrigger>
          <TabsTrigger value="compoff">Comp-off credits</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Approved">Approved</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          <TabsTrigger value="All">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {section === "leave" ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No requests
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => {
                  const u = users.find((x) => x.id === l.userId);
                  return (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="font-medium">{l.userName || u?.name}</div>
                        <div className="text-xs text-muted-foreground">{l.userDepartment || u?.department}</div>
                      </TableCell>
                      <TableCell>{l.type}</TableCell>
                      <TableCell>{l.duration === "half" ? "Half day" : "Full day"}</TableCell>
                      <TableCell>{l.startDate}</TableCell>
                      <TableCell>{l.endDate}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{l.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {l.status === "Pending" ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" disabled={busy === l.id} onClick={() => handleDecideLeave(l.id, "Approved")}>
                              <Check className="size-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === l.id}
                              onClick={() => handleDecideLeave(l.id, "Rejected")}
                            >
                              <X className="size-4" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No comp-off requests
                  </TableCell>
                </TableRow>
              ) : (
                compOffRequests.map((r) => {
                  const u = users.find((x) => x.id === r.userId);
                  const pendingCredit = r.duration === "half" ? 0.5 : 1;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.userName || u?.name}</div>
                        <div className="text-xs text-muted-foreground">{r.userDepartment || u?.department}</div>
                      </TableCell>
                      <TableCell>{r.overtimeDate}</TableCell>
                      <TableCell className="capitalize">{r.duration === "half" ? "Half day" : "Full day"}</TableCell>
                      <TableCell className="max-w-[240px] truncate text-muted-foreground">{r.reason}</TableCell>
                      <TableCell>
                        {r.status === "Approved" && r.creditAmount != null
                          ? `+${formatLeaveDays(r.creditAmount)}`
                          : `+${formatLeaveDays(pendingCredit)}`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === "Pending" ? (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" disabled={busy === r.id} onClick={() => handleDecideCompOff(r.id, "Approved")}>
                              <Check className="size-4" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === r.id}
                              onClick={() => handleDecideCompOff(r.id, "Rejected")}
                            >
                              <X className="size-4" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
