import { createFileRoute } from "@tanstack/react-router";
import { validateEmployeeId } from "@/lib/auth-helpers";
import { store, saveEmployee, toggleEmployeeActive, deleteEmployee } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader, StatusBadge } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Power, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — WorkFlow HR" }] }),
  component: EmployeesPage,
});

const empty = { name: "", email: "", employeeId: "", department: "", designation: "", phone: "", earnedLeaves: 0, compOffLeaves: 0 };

function EmployeesPage() {
  useWorkflowRefresh();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const list = store.getUsers().filter((u) => u.role === "employee");
  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(q.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(q.toLowerCase()) ||
      (u.employeeId || "").toLowerCase().includes(q.toLowerCase())
  );

  function openCreate() {
    setEdit(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(u) {
    setEdit(u);
    setForm({
      name: u.name,
      email: u.email || "",
      employeeId: u.employeeId,
      department: u.department,
      designation: u.designation,
      phone: u.phone,
      earnedLeaves: u.leaveBalances?.earnedTotal ?? 0,
      compOffLeaves: u.leaveBalances?.compOffTotal ?? 0,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.phone?.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    let employeeId;
    try {
      employeeId = validateEmployeeId(form.employeeId);
    } catch (err) {
      toast.error(err.message);
      return;
    }
    setSaving(true);
    try {
      await saveEmployee(edit, { ...form, employeeId });
      toast.success(edit ? "Employee updated" : "Employee added");
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(user) {
    try {
      await toggleEmployeeActive(user);
      toast.success(user.active ? "Employee deactivated" : "Employee activated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      toast.success("Employee deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your team members."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Add employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{edit ? "Edit employee" : "Add employee"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Full name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Employee ID</Label>
                  <Input
                    className="uppercase"
                    placeholder="EMP-1001"
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Earned Leaves</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.earnedLeaves}
                    onChange={(e) => setForm({ ...form, earnedLeaves: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Comp-off Leaves</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.compOffLeaves}
                    onChange={(e) => setForm({ ...form, compOffLeaves: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {edit ? "Save changes" : "Add employee"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, ID…"
              className="pl-9"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">
                    No employees yet. Add team members or ask them to sign up.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email || "No email"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.employeeId}</TableCell>
                    <TableCell>{u.department}</TableCell>
                    <TableCell>{u.designation}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.active ? "Active" : "Inactive"} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-0.5">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(u)} title="Edit">
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggle(u)} title={u.active ? "Deactivate" : "Activate"}>
                          <Power className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(u)}
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.name} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
