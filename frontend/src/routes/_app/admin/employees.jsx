import { createFileRoute } from "@tanstack/react-router";
import { validateEmployeeId } from "@/lib/auth-helpers";
import { store, saveEmployee, toggleEmployeeActive, deleteEmployee } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Power, Pencil, Trash2, ChevronLeft, ChevronRight,
  User, Mail, CreditCard, Phone, Building2, Briefcase, Lock, Eye, EyeOff,
  CalendarCheck, History, X, Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Shared dark palette (matches login/signup) ── */
const S = {
  bg: "#1e2022", border: "#434655", text: "#e2e2e5",
  placeholder: "#90909a", surface: "#121416", card: "#1a1c1e",
  primary: "#dde1ff", primaryText: "#071749",
  muted: "#c4c5d7", accent: "#6ffbbe",
  surfaceHigh: "#282a2d", outlineVariant: "rgba(67,70,85,0.4)",
};

function FieldInput({ icon: Icon, type = "text", rightSlot, value, onChange, placeholder, className = "", ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none z-10"
        style={{ color: focused ? S.primary : S.placeholder }} />
      <input
        {...rest} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-11 pl-10 pr-4 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: S.bg, borderColor: focused ? S.primary : S.border, color: S.text,
          boxShadow: focused ? "0 0 0 1px rgba(221,225,255,0.15)" : "none",
          paddingRight: rightSlot ? "2.75rem" : undefined,
        }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {rightSlot}
    </div>
  );
}

function EmployeeFormModal({ open, onOpenChange, edit, form, setForm, onSave, saving }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{ backdropFilter: "blur(8px)", background: "rgba(12,14,16,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border overflow-hidden"
        style={{
          background: S.card, borderColor: S.outlineVariant,
          boxShadow: "0 20px 50px -12px rgba(0,0,0,0.7)",
          transform: open ? "scale(1)" : "scale(0.97)",
          transition: "transform 0.2s, opacity 0.2s",
        }}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b flex justify-between items-start"
          style={{ background: S.surface, borderColor: S.outlineVariant }}>
          <div>
            <h2 className="font-headline text-lg font-bold" style={{ color: S.text }}>
              {edit ? "Edit Employee" : "Add New Employee"}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: S.muted }}>
              {edit ? "Update the employee's profile details." : "Fill in the details to create a new profile."}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 transition-colors hover:opacity-70"
            style={{ color: S.muted }}>
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Row 1: Full Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Full Name</label>
              <FieldInput icon={User} placeholder="e.g. John Doe" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Email Address <span className="opacity-50 normal-case font-normal">Optional</span></label>
              <FieldInput icon={Mail} type="email" placeholder="john@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          {/* Row 2: Employee ID + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Employee ID</label>
              <FieldInput icon={CreditCard} placeholder="EMP-1001" className="uppercase" value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Phone Number</label>
              <FieldInput icon={Phone} type="tel" placeholder="+1 (555) 000-0000" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {/* Row 3: Department + Designation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Department</label>
              <FieldInput icon={Building2} placeholder="e.g. Engineering" value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Designation</label>
              <FieldInput icon={Briefcase} placeholder="e.g. Senior Developer" value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>

          {/* Password (create only) */}
          {!edit && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Temporary Password</label>
              <FieldInput
                icon={Lock} type={showPw ? "text" : "password"}
                placeholder="At least 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                rightSlot={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 hover:opacity-70 transition-opacity"
                    style={{ color: S.placeholder }}>
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
              <p className="text-[11px] mt-1" style={{ color: "#6b6d7e" }}>Employee will be prompted to change password upon first login.</p>
            </div>
          )}

          {/* Leave Balances */}
          <div className="pt-4 border-t space-y-4" style={{ borderColor: S.outlineVariant }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.primary }}>Initial Leave Balances</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Earned Leaves</label>
                <FieldInput icon={CalendarCheck} type="number" placeholder="0" value={form.earnedLeaves}
                  onChange={(e) => setForm({ ...form, earnedLeaves: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>Comp-off Leaves</label>
                <FieldInput icon={History} type="number" placeholder="0" value={form.compOffLeaves}
                  onChange={(e) => setForm({ ...form, compOffLeaves: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t flex items-center justify-end gap-3"
          style={{ borderColor: S.outlineVariant, background: S.card }}>
          <button type="button" onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: S.muted }}>
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 hover:opacity-90 disabled:opacity-60"
            style={{ background: S.primary, color: S.primaryText }}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {edit ? "Save changes" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_app/admin/employees")({
  head: () => ({ meta: [{ title: "Employees — WorkFlow HR" }] }),
  component: EmployeesPage,
});

const empty = {
  name: "", email: "", employeeId: "", department: "",
  designation: "", phone: "", earnedLeaves: 0, compOffLeaves: 0, password: "",
};

/* Deterministic avatar background color from name */
const AVATAR_PALETTES = [
  { bg: "bg-primary-fixed",    text: "text-on-primary-fixed" },
  { bg: "bg-tertiary-fixed",   text: "text-tertiary" },
  { bg: "bg-secondary-fixed",  text: "text-on-secondary-fixed" },
  { bg: "bg-error-container",  text: "text-on-error-container" },
];
function avatarStyle(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

const PAGE_SIZE = 8;

function EmployeesPage() {
  useWorkflowRefresh();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function openCreate() {
    setEdit(null);
    setForm({ ...empty, password: "password" });
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
      password: "",
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.phone?.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    let employeeId;
    try { employeeId = validateEmployeeId(form.employeeId); }
    catch (err) { toast.error(err.message); return; }
    const tempPassword = form.password?.trim() || "password";
    if (!edit && tempPassword.length < 6) {
      toast.error("Temporary password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      await saveEmployee(edit, { ...form, employeeId }, tempPassword);
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
    <div className="space-y-6 sm:space-y-8">
      {/* ── Custom Employee Form Modal ── */}
      <EmployeeFormModal
        open={open} onOpenChange={setOpen}
        edit={edit} form={form} setForm={setForm}
        onSave={handleSave} saving={saving}
      />

      {/* ── Page Header ── */}
      <PageHeader
        title="Employees"
        description="Manage your team members."
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="size-4" />
            Add employee
          </button>
        }
      />

      {/* ── Bento Table Container ── */}
      <div className="bg-card rounded-2xl border border-border/40 card-shadow overflow-hidden">

        {/* Table search bar */}
        <div className="px-6 py-4 border-b border-border/40">
          <div className="relative max-w-sm">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
            />
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border/40">
                {["Name", "Employee ID", "Department", "Designation", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                      h === "Actions" && "text-right"
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
                  <td colSpan={6} className="px-6 py-16 text-center text-sm text-muted-foreground">
                    No employees found.
                  </td>
                </tr>
              ) : (
                paged.map((u) => {
                  const { bg, text } = avatarStyle(u.name);
                  const initials = u.name.split(" ").map((s) => s[0]).slice(0, 1).join("").toUpperCase();
                  const isActive = u.active !== false;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-muted/30 transition-all duration-150"
                      style={{ transition: "background-color 0.15s, transform 0.15s, box-shadow 0.15s" }}
                    >
                      {/* Name + avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ring-primary-fixed",
                            bg, text
                          )}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{u.name}</p>
                            <p className="text-[12px] text-muted-foreground truncate">{u.email || "No email"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                        {u.employeeId}
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4 text-sm">{u.department}</td>

                      {/* Designation */}
                      <td className="px-6 py-4 text-sm uppercase">{u.designation}</td>

                      {/* Status pill */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-tertiary-fixed/25 text-tertiary">
                            <span className="size-1.5 rounded-full bg-tertiary inline-block" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-destructive/10 text-destructive">
                            <span className="size-1.5 rounded-full bg-destructive inline-block" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            title="Edit"
                            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="size-[18px]" />
                          </button>
                          <button
                            onClick={() => handleToggle(u)}
                            title={isActive ? "Deactivate" : "Activate"}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Power className="size-[18px]" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            title="Delete"
                            className="p-2 rounded-lg text-muted-foreground hover:bg-error-container hover:text-on-error-container transition-colors"
                          >
                            <Trash2 className="size-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            {filtered.length === 0
              ? "No employees"
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filtered.length)} of ${filtered.length} employee${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={cn(
                  "size-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors",
                  n === safePage
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {n}
              </button>
            ))}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.name}</strong> and cannot be undone.
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
