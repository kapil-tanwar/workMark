import { createFileRoute, Link } from "@tanstack/react-router";
import { store } from "@/lib/store";
import { useWorkflowRefresh } from "@/hooks/use-workflow-refresh";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail, Phone, Building2, BadgeCheck, IdCard,
  Building, Clock, CalendarDays, Pencil, KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forgotPassword, getAdminRequests, approveAdminRequest, rejectAdminRequest, generate2FA, verify2FA } from "@/lib/api";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — WorkFlow HR" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  useWorkflowRefresh();
  const { user, updateProfile } = useAuth();
  const [s, setS] = useState(store.getSettings());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Forgot password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // 2FA Setup states
  const [setup2faOpen, setSetup2faOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [setup2faOtp, setSetup2faOtp] = useState("");
  const [setup2faLoading, setSetup2faLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "", email: "", phone: "", department: "", designation: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    companyName: "", companyEmail: "", workingHours: "", monthlyEarnedAccrual: 1.5,
  });

  function openForgot() {
    setForgotIdentifier(user?.email || user?.employeeId || "");
    setForgotPhone(user?.phone || "");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotSuccess(false);
    setForgotOpen(true);
  }

  async function openSetup2fa() {
    setSetup2faLoading(true);
    setSetup2faOpen(true);
    try {
      const res = await generate2FA();
      setQrCodeData(res.qrCode);
    } catch (err) {
      toast.error(err.message);
      setSetup2faOpen(false);
    } finally {
      setSetup2faLoading(false);
    }
  }

  async function handleVerify2FA(e) {
    e.preventDefault();
    if (!setup2faOtp) return;
    setSetup2faLoading(true);
    try {
      await verify2FA(setup2faOtp);
      toast.success("2FA enabled successfully!");
      setSetup2faOpen(false);
      window.location.reload(); 
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSetup2faLoading(false);
    }
  }

  async function handleForgotResetPassword(e) {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword) { toast.error("Please fill in all fields"); return; }
    setForgotLoading(true);
    try {
      await forgotPassword({ identifier: forgotIdentifier, phone: forgotPhone, otp: forgotOtp, newPassword: forgotNewPassword });
      setForgotSuccess(true);
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setForgotLoading(false);
    }
  }

  async function loadRequests() {
    setLoadingRequests(true);
    try {
      const data = await getAdminRequests();
      setRequests(data);
    } catch (e) {
      toast.error("Failed to load admin requests");
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    const sync = () => setS(store.getSettings());
    sync();
    loadRequests();
    window.addEventListener("wf:change", sync);
    return () => window.removeEventListener("wf:change", sync);
  }, []);

  async function handleApprove(id) {
    try {
      await approveAdminRequest(id);
      toast.success("Admin request approved");
      loadRequests();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleReject(id) {
    try {
      await rejectAdminRequest(id);
      toast.success("Admin request rejected");
      loadRequests();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!user) return null;

  function openEdit() {
    setProfileForm({
      name: user.name || "", email: user.email || "", phone: user.phone || "",
      department: user.department || "", designation: user.designation || "",
    });
    setSettingsForm({
      companyName: s.companyName || "", companyEmail: s.companyEmail || "",
      workingHours: s.workingHours || "", monthlyEarnedAccrual: s.monthlyEarnedAccrual ?? 1.5,
    });
    setEditDialogOpen(true);
  }

  async function handleSave() {
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      toast.error("Profile name and phone are required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: profileForm.name.trim(), email: profileForm.email.trim(),
        phone: profileForm.phone.trim(), department: profileForm.department.trim(),
        designation: profileForm.designation.trim(),
      });
      await store.setSettings(settingsForm);
      setS(settingsForm);
      toast.success("Profile and Settings updated");
      setEditDialogOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  /* Profile detail items — primary-fixed icon tiles */
  const profileItems = [
    { icon: IdCard,    label: "Employee ID",  value: user.employeeId || "—", tile: "bg-primary-fixed text-on-primary-fixed" },
    { icon: Mail,      label: "Email",        value: user.email || "—",      tile: "bg-primary-fixed text-on-primary-fixed" },
    { icon: Phone,     label: "Phone",        value: user.phone || "—",      tile: "bg-primary-fixed text-on-primary-fixed" },
    { icon: Building2, label: "Department",   value: user.department || "—", tile: "bg-primary-fixed text-on-primary-fixed" },
    { icon: BadgeCheck,label: "Designation",  value: user.designation || "—",tile: "bg-primary-fixed text-on-primary-fixed" },
  ];

  /* Company settings items — secondary-fixed icon tiles */
  const settingItems = [
    { icon: Building,    label: "Company Name",         value: s.companyName || "—",                          tile: "bg-secondary-fixed text-on-secondary-fixed" },
    { icon: Mail,        label: "HR Contact Email",      value: s.companyEmail || "—",                         tile: "bg-secondary-fixed text-on-secondary-fixed" },
    { icon: Clock,       label: "Working Hours",         value: s.workingHours || "—",                         tile: "bg-secondary-fixed text-on-secondary-fixed" },
    { icon: CalendarDays,label: "Monthly Leave Accrual", value: `${s.monthlyEarnedAccrual ?? 1.5} days`,        tile: "bg-secondary-fixed text-on-secondary-fixed" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Settings"
        description="Company info, leave policies, and admin profile details."
      />

      {/* ── Main Card ── */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden card-shadow">

        {/* Cover banner — gradient matching reference blue */}
        <div className="h-48 bg-gradient-to-br from-[#001551] via-[#0037b0] to-[#2151da] relative overflow-hidden">
          {/* Subtle geometric overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, rgba(183,196,255,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(111,251,190,0.2) 0%, transparent 50%)"
            }}
          />
        </div>

        {/* Profile info section */}
        <div className="px-6 sm:px-8 pb-8 relative">
          {/* Avatar — overlaps the banner */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 mb-6 gap-4">
            <div className="flex items-end gap-5">
              <div className="size-24 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                {initials}
              </div>
              <div className="pb-1">
                <h3 className="font-headline text-2xl font-bold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.designation || "Administrator"} · {user.department || "Administration"} (Admin Portal)
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-row gap-2 w-full md:w-auto shrink-0 mb-1">
              <button
                onClick={openEdit}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 whitespace-nowrap"
              >
                <Pencil className="size-4" />
                <span className="truncate">Edit</span>
              </button>
              <button
                onClick={openForgot}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-border bg-card text-foreground px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted active:scale-95 transition-all whitespace-nowrap"
              >
                <KeyRound className="size-4" />
                <span className="truncate">Reset password</span>
              </button>
              {!user.is2faEnabled && (
                <button
                  onClick={openSetup2fa}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-border bg-card text-foreground px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted active:scale-95 transition-all whitespace-nowrap"
                >
                  <span className="truncate text-success">Setup 2FA</span>
                </button>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left — Admin Profile */}
            <div className="space-y-4">
              <h4 className="font-headline text-lg font-bold text-foreground border-b border-border/40 pb-3">
                Admin Profile Details
              </h4>
              <div className="space-y-3">
                {profileItems.map(({ icon: Icon, label, value, tile }) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/20 hover:bg-muted/50 transition-all"
                  >
                    <div className={cn("size-10 shrink-0 rounded-lg flex items-center justify-center", tile)}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-base font-bold text-foreground mt-0.5 truncate" title={value}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Company & Leave Policy */}
            <div className="space-y-4">
              <h4 className="font-headline text-lg font-bold text-foreground border-b border-border/40 pb-3">
                Company &amp; Leave Policy Settings
              </h4>
              <div className="space-y-3">
                {settingItems.map(({ icon: Icon, label, value, tile }) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/20 hover:bg-muted/50 transition-all"
                  >
                    <div className={cn("size-10 shrink-0 rounded-lg flex items-center justify-center", tile)}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-base font-bold text-foreground mt-0.5 truncate" title={value}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Requests Section ── */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden card-shadow p-6 sm:p-8 space-y-6">
        <h4 className="font-headline text-lg font-bold text-foreground border-b border-border/40 pb-3">
          Pending Admin Approvals
        </h4>
        {loadingRequests ? (
          <div className="flex justify-center p-4"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending admin requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                <div>
                  <p className="font-bold text-foreground">{req.name} <span className="text-muted-foreground text-xs font-normal">({req.employeeId})</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">{req.email || "No email"} · {req.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleReject(req._id)} className="h-9 px-4 rounded-lg font-semibold border-border hover:bg-destructive/10 hover:text-destructive">Reject</Button>
                  <Button size="sm" onClick={() => handleApprove(req._id)} className="h-9 px-4 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90">Approve</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 pb-2 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">© 2024 WorkFlow HR Solutions. All rights reserved.</p>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 rounded-2xl  overflow-hidden bg-background border-border sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-8 py-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-muted/30">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Edit Settings &amp; Profile</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">Update company configuration and your administrator details.</DialogDescription>
            </div>
            {/* The close button is handled by DialogContent primitive, but we can leave the space */}
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10">
            {/* Admin Profile */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <h3 className="text-base font-semibold text-foreground">Admin Personal Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</Label>
                  <Input value={user.employeeId} disabled className="h-12 bg-muted/50 border-border opacity-70 rounded-xl" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                  <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary focus-visible:border-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Company Settings */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                <div className="size-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                </div>
                <h3 className="text-base font-semibold text-foreground">Company &amp; Policy Configurations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={settingsForm.companyName} onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">HR Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input type="email" value={settingsForm.companyEmail} onChange={(e) => setSettingsForm({ ...settingsForm, companyEmail: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Working Hours</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input value={settingsForm.workingHours} placeholder="09:00 – 18:00" onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Earned Leave Accrual (days)</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="number" step="0.5" min="0"
                      value={settingsForm.monthlyEarnedAccrual}
                      onChange={(e) => setSettingsForm({ ...settingsForm, monthlyEarnedAccrual: parseFloat(e.target.value) || 0 })}
                      className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                    Added automatically at 00:00:01 on the 1st of every month for active employees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-border/50 bg-muted/30 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold border-border hover:bg-muted" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto h-11 px-8 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90">
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Forgot Password Dialog ── */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-background border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
          {forgotSuccess ? (
            /* Success State */
            <div className="text-center space-y-5 py-4">
              <div className="size-14 mx-auto rounded-full flex items-center justify-center bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold mb-2 text-foreground">Password Reset Successful</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Your password has been reset. You can now use your new password.
                </DialogDescription>
              </div>
              <Button onClick={() => setForgotOpen(false)} className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90">
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="pb-3 border-b border-border">
                <DialogTitle className="text-xl font-bold text-foreground">
                  Reset Password
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Enter your details and your Google Authenticator code to reset your password.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleForgotResetPassword} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email or Employee ID</Label>
                  <Input type="text" required placeholder="Email or EMP ID" value={forgotIdentifier} onChange={(e) => setForgotIdentifier(e.target.value)} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                  <Input type="tel" required placeholder="+919876543210" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google Auth Code</Label>
                  <Input type="text" required placeholder="6-digit code" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input type={forgotShowPassword ? "text" : "password"} required placeholder="New Password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                    <button type="button" onClick={() => setForgotShowPassword(!forgotShowPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {forgotShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={forgotLoading} className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold">
                    {forgotLoading ? <Loader2 className="size-4 animate-spin" /> : "Reset Password"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Setup 2FA Dialog ── */}
      <Dialog open={setup2faOpen} onOpenChange={setSetup2faOpen}>
        <DialogContent className="sm:max-w-sm p-6 bg-background border-border rounded-2xl shadow-2xl flex flex-col">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-xl font-bold text-foreground">Setup Google Authenticator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVerify2FA} className="space-y-4 pt-4 text-center">
            {setup2faLoading && !qrCodeData ? (
              <div className="flex justify-center p-6"><Loader2 className="size-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Scan this QR code with Google Authenticator, then enter the 6-digit code below to verify.</p>
                {qrCodeData && <img src={qrCodeData} alt="2FA QR Code" className="mx-auto rounded-xl border p-2 bg-white" />}
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">6-Digit Code</Label>
                  <Input type="text" required placeholder="123456" value={setup2faOtp} onChange={(e) => setSetup2faOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm text-center tracking-widest font-mono text-lg" />
                </div>
                <Button type="submit" disabled={setup2faLoading || !setup2faOtp} className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold">
                  {setup2faLoading ? <Loader2 className="size-4 animate-spin" /> : "Verify & Enable"}
                </Button>
              </>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
