import { createFileRoute } from "@tanstack/react-router";
import { store, decideLeave } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/leaves")({
  head: () => ({ meta: [{ title: "Leave Requests — WorkFlow HR" }] }),
  component: AdminLeaves,
});

function AdminLeaves() {
  useWorkflowRefresh();
  const [tab, setTab] = useState("Pending");
  const [busy, setBusy] = useState(null);

  const users = store.getUsers();
  const leaves = store
    .getLeaves()
    .filter((l) => tab === "All" || l.status === tab)
    .sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  async function handleDecide(id, status) {
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

  return (
    <div className="space-y-6">
      <PageHeader title="Leave requests" description="Approve or reject team leave requests." />

      <Tabs value={tab} onValueChange={(v) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Approved">Approved</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
          <TabsTrigger value="All">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
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
                    <TableCell>{l.startDate}</TableCell>
                    <TableCell>{l.endDate}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{l.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {l.status === "Pending" ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" disabled={busy === l.id} onClick={() => handleDecide(l.id, "Approved")}>
                            <Check className="size-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy === l.id}
                            onClick={() => handleDecide(l.id, "Rejected")}
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
    </div>
  );
}
