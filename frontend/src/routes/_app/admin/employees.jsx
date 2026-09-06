
import { validateEmployeeId, isDemoUser } from "@/lib/auth-helpers";
import { useAuth } from "@/lib/auth-context";
import { store, saveEmployee, toggleEmployeeActive, deleteEmployee, leaveBalance } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";

import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Search, Power, Pencil, Trash2, ChevronLeft, ChevronRight,
  User, Mail, CreditCard, Phone, Building2, Briefcase, Lock, Eye, EyeOff,
  CalendarCheck, History, X, Loader2, Ban, Shuffle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEMO_PRESETS = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma",
    department: "Engineering",
    designation: "Senior Frontend Engineer",
    earnedLeaves: 12,
    compOffLeaves: 2,
  },
  {
    name: "Ananya Patel",
    email: "ananya.patel",
    department: "Human Resources",
    designation: "HR Generalist",
    earnedLeaves: 14,
    compOffLeaves: 3,
  },
  {
    name: "Rohan Verma",
    email: "rohan.verma",
    department: "Product",
    designation: "Product Manager",
    earnedLeaves: 12,
    compOffLeaves: 1,
  },
  {
    name: "Priya Nair",
    email: "priya.nair",
    department: "Design",
    designation: "Lead UI/UX Designer",
    earnedLeaves: 15,
    compOffLeaves: 2,
  },
  {
    name: "Aditya Kulkarni",
    email: "aditya.kulkarni",
    department: "Engineering",
    designation: "Backend Systems Engineer",
    earnedLeaves: 10,
    compOffLeaves: 2,
  },
  {
    name: "Neha Gupta",
    email: "neha.gupta",
    department: "Marketing",
    designation: "Growth Marketing Lead",
    earnedLeaves: 11,
    compOffLeaves: 1,
  },
  {
    name: "Vikram Malhotra",
    email: "vikram.malhotra",
    department: "Operations",
    designation: "Operations Manager",
    earnedLeaves: 13,
    compOffLeaves: 0,
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer",
    department: "Finance",
    designation: "Senior Financial Analyst",
    earnedLeaves: 12,
    compOffLeaves: 2,
  },
  {
    name: "Arjun Deshmukh",
    email: "arjun.deshmukh",
    department: "Customer Success",
    designation: "Client Relations Lead",
    earnedLeaves: 10,
    compOffLeaves: 1,
  },
  {
    name: "Kavya Reddy",
    email: "kavya.reddy",
    department: "Engineering",
    designation: "QA Automation Engineer",
    earnedLeaves: 14,
    compOffLeaves: 2,
  },
  {
    name: "Ishaan Mehta",
    email: "ishaan.mehta",
    department: "Data & AI",
    designation: "Machine Learning Engineer",
    earnedLeaves: 12,
    compOffLeaves: 3,
  },
  {
    name: "Tanvi Joshi",
    email: "tanvi.joshi",
    department: "Legal & Compliance",
    designation: "Compliance Officer",
    earnedLeaves: 11,
    compOffLeaves: 1,
  },
];

function generateDemoEmployee(existingUsers = [], presetIdx = 0) {
  const p = DEMO_PRESETS[presetIdx % DEMO_PRESETS.length];
  const randNum = Math.floor(100 + Math.random() * 900);

  let candidateNum = existingUsers.length + 10;
  let candidateId = `EMP-${candidateNum}`;
  while (existingUsers.some((u) => (u.employeeId || "").toUpperCase() === candidateId)) {
    candidateNum++;
    candidateId = `EMP-${candidateNum}`;
  }

  const candidateEmail = `${p.email}${randNum}@workflow.hr`;
  const candidatePhone = `+91 98765 ${Math.floor(10000 + Math.random() * 90000)}`;

  return {
    name: p.name,
    email: candidateEmail,
    employeeId: candidateId,
    phone: candidatePhone,
    department: p.department,
    designation: p.designation,
    password: "password",
    earnedLeaves: p.earnedLeaves,
    compOffLeaves: p.compOffLeaves,
  };
}

/* ── Shared dark palette (matches login/signup) ── */
const S = {
  bg: "#1e2022", border: "#434655", text: "#e2e2e5",
  placeholder: "#90909a", surface: "#121416", card: "#1a1c1e",
  primary: "#dde1ff", primaryText: "#071749",
  muted: "#c4c5d7", accent: "#6ffbbe",
  surfaceHigh: "#282a2d", outlineVariant: "rgba(67,70,85,0.4)",
};

function FieldInput({ icon: Icon, type = "text", rightSlot, value, onChange, placeholder, className = "", readOnly = false, ...rest }) {
  const [focused, setFocused] = useState(false);
  const isLocked = Boolean(readOnly || rest.disabled);
  return (
    <div
      className={cn("relative group", isLocked && "cursor-not-allowed", className)}
      title={isLocked ? (rest.title || "Disabled in demo account") : rest.title}
    >
      <Icon className={cn("absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none z-10 transition-colors", focused ? "text-primary" : "text-muted-foreground", isLocked && "opacity-60")} />
      <input
        {...rest} type={type} value={value} onChange={onChange} placeholder={placeholder}
        readOnly={readOnly}
        onWheel={type === "number" ? (e) => e.target.blur() : undefined}
        className={cn(
          "w-full h-11 pl-10 rounded-xl text-sm border outline-none transition-all",
          "bg-transparent dark:bg-background text-foreground border-input placeholder:text-muted-foreground",
          focused ? "ring-1 ring-primary border-primary" : "",
          isLocked ? "bg-muted/40 opacity-85 cursor-not-allowed select-none group-hover:border-amber-500/40 group-hover:bg-muted/60" : ""
        )}
        style={{ paddingRight: rightSlot ? "2.75rem" : (isLocked ? "2.5rem" : "1rem") }}
        onFocus={() => !isLocked && setFocused(true)} onBlur={() => setFocused(false)}
      />
      {/* Visual icon showing field is disabled on hover/locked */}
      {isLocked && (
        <div
          title="Disabled in demo account"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center transition-all duration-150",
            rightSlot
              ? "right-10 text-muted-foreground/50 group-hover:text-amber-500"
              : "right-3.5 text-muted-foreground/50 group-hover:text-amber-500 group-hover:scale-110"
          )}
        >
          <Ban className="size-4" />
        </div>
      )}
      {rightSlot}
    </div>
  );
}

function EmployeeFormModal({ open, onOpenChange, edit, form, setForm, onSave, saving, isDemoAdmin, onShufflePreset }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 bg-black/80",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{ backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]"
        style={{
          transform: open ? "scale(1)" : "scale(0.97)",
          transition: "transform 0.2s, opacity 0.2s",
        }}
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-border/40 flex justify-between items-start bg-background">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-foreground">
                {edit ? "Edit Employee" : "Add New Employee"}
              </h2>
              {isDemoAdmin && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Demo Protected
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5 text-muted-foreground">
              {edit ? "Update the employee's profile details." : "Fill in the details to create a new profile."}
            </p>
          </div>
          <button onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 transition-colors text-muted-foreground hover:opacity-70">
            <X className="size-4" />
          </button>
        </div>

        {/* Demo Mode Notice */}
        {isDemoAdmin && (
          <div className="px-7 pt-4">
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-primary font-medium">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span>
                  <strong>Demo Mode:</strong> {edit ? "Default verified profile details are prefilled so test data stays clean." : "Default verified values are prefilled so test data stays clean."}
                </span>
              </div>
              {!edit && onShufflePreset && (
                <button
                  type="button"
                  onClick={onShufflePreset}
                  className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 active:scale-95 font-bold transition-all text-primary text-[11px] self-start sm:self-auto cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Shuffle className="size-3.5" />
                  Shuffle Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-7 py-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Row 1: Full Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</label>
              <FieldInput icon={User} placeholder="Your Name" value={form.name} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email Address <span className="opacity-50 normal-case font-normal">Optional</span></label>
              <FieldInput icon={Mail} type="email" placeholder="name@company.com" value={form.email} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          {/* Row 2: Employee ID + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Employee ID</label>
              <FieldInput icon={CreditCard} placeholder="EMP-1001" className="uppercase" value={form.employeeId} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</label>
              <FieldInput icon={Phone} type="tel" placeholder="+91 98765 43210" value={form.phone} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          {/* Row 3: Department + Designation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Department</label>
              <FieldInput icon={Building2} placeholder="e.g. Engineering" value={form.department} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Designation</label>
              <FieldInput icon={Briefcase} placeholder="e.g. Senior Developer" value={form.designation} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>

          {/* Password (create only) */}
          {!edit && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Temporary Password</label>
              <FieldInput
                icon={Lock} type={showPw ? "text" : "password"}
                placeholder="At least 6 characters" value={form.password} readOnly={isDemoAdmin}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                rightSlot={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 hover:opacity-70 transition-opacity text-muted-foreground">
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
              <p className="text-[11px] mt-1 text-muted-foreground/80">Employee will be prompted to change password upon first login.</p>
            </div>
          )}

          {/* Leave Balances */}
          <div className="pt-4 border-t border-border/40 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Initial Leave Balances</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Earned Leaves</label>
                <FieldInput icon={CalendarCheck} type="number" placeholder="0" value={form.earnedLeaves} readOnly={isDemoAdmin}
                  onChange={(e) => setForm({ ...form, earnedLeaves: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Comp-off Leaves</label>
                <FieldInput icon={History} type="number" placeholder="0" value={form.compOffLeaves} readOnly={isDemoAdmin}
                  onChange={(e) => setForm({ ...form, compOffLeaves: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-border/40 flex items-center justify-end gap-3 bg-card">
          <button type="button" onClick={() => onOpenChange(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors text-muted-foreground hover:bg-muted">
            Cancel
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {edit ? "Save changes" : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}



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

export default function EmployeesPage() {
  useWorkflowRefresh();
  const { user: currentUser } = useAuth();
  const isDemoAdmin = isDemoUser(currentUser);
  const [presetIndex, setPresetIndex] = useState(0);

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
    if (isDemoAdmin) {
      const preset = generateDemoEmployee(store.getUsers(), presetIndex);
      setForm(preset);
    } else {
      setForm({ ...empty, password: "password" });
    }
    setOpen(true);
  }

  function handleShufflePreset() {
    const nextIdx = presetIndex + 1;
    setPresetIndex(nextIdx);
    const preset = generateDemoEmployee(store.getUsers(), nextIdx);
    setForm(preset);
    toast.info(`Loaded default profile: ${preset.name}`);
  }

  function openEdit(u) {
    setEdit(u);
    const bal = leaveBalance(u.id);
    if (isDemoAdmin) {
      // In demo mode: prefill with clean verified default values so no rubbish can be submitted
      setForm({
        name: u.name || "Demo Employee",
        email: u.email || "employee@employee.com",
        employeeId: u.employeeId || "EMPLOYEE00",
        department: u.department || "Engineering",
        designation: u.designation || (isDemoUser(u) ? "Senior Staff Engineer" : "Software Engineer"),
        phone: u.phone || "+91 98765 00002",
        earnedLeaves: bal.earned.remaining ?? 12,
        compOffLeaves: bal.compOff.remaining ?? 2,
        password: "password",
      });
    } else {
      setForm({
        name: u.name,
        email: u.email || "",
        employeeId: u.employeeId,
        department: u.department,
        designation: u.designation,
        phone: u.phone,
        earnedLeaves: bal.earned.remaining,
        compOffLeaves: bal.compOff.remaining,
        password: "",
      });
    }
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

    let earnedToSend = Number(form.earnedLeaves) || 0;
    let compOffToSend = Number(form.compOffLeaves) || 0;
    if (edit) {
      const bal = leaveBalance(edit.id);
      earnedToSend = (Number(form.earnedLeaves) || 0) + bal.earned.used;
      compOffToSend = (Number(form.compOffLeaves) || 0) + bal.compOff.used;
    }

    setSaving(true);
    try {
      await saveEmployee(edit, { ...form, employeeId, earnedLeaves: earnedToSend, compOffLeaves: compOffToSend }, tempPassword);
      toast.success(edit ? "Employee updated" : "Employee added");
      setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(user) {
    if (user.role === "admin" && (user.email === "admin@admin.com" || (user.employeeId || "").toUpperCase() === "ADMIN00")) {
      toast.error("Demo admin account status cannot be changed");
      return;
    }
    try {
      await toggleEmployeeActive(user);
      toast.success(user.active ? "Employee deactivated" : "Employee activated");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.role === "admin" && (deleteTarget.email === "admin@admin.com" || (deleteTarget.employeeId || "").toUpperCase() === "ADMIN00")) {
      toast.error("Demo admin account cannot be deleted");
      setDeleteTarget(null);
      return;
    }
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
        isDemoAdmin={isDemoAdmin}
        onShufflePreset={handleShufflePreset}
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
                  const isDemo = isDemoUser(u);
                  const isSelfAdmin = u.role === "admin" && (u.email === "admin@admin.com" || (u.employeeId || "").toUpperCase() === "ADMIN00");
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
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-foreground truncate">{u.name}</p>
                              {isDemo && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Demo
                                </span>
                              )}
                            </div>
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
                            title={isDemoAdmin ? "Edit employee (Default verified values in Demo)" : "Edit"}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            <Pencil className="size-[18px]" />
                          </button>
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={isSelfAdmin}
                            title={isSelfAdmin ? "Demo admin account status cannot be changed" : (isActive ? "Deactivate employee" : "Activate employee")}
                            className={cn(
                              "p-2 rounded-lg transition-colors cursor-pointer",
                              isSelfAdmin
                                ? "text-muted-foreground/30 cursor-not-allowed"
                                : (isActive
                                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    : "text-amber-500/80 hover:bg-amber-500/10 hover:text-amber-500")
                            )}
                          >
                            <Power className="size-[18px]" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(u)}
                            disabled={isSelfAdmin}
                            title={isSelfAdmin ? "Demo admin account cannot be deleted" : "Delete employee"}
                            className={cn(
                              "p-2 rounded-lg transition-colors cursor-pointer",
                              isSelfAdmin
                                ? "text-muted-foreground/30 cursor-not-allowed"
                                : "text-muted-foreground hover:bg-error-container hover:text-on-error-container"
                            )}
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
