import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Building2, BadgeCheck, IdCard, KeyRound, Pencil, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { forgotPassword, generate2FA, verify2FA } from "@/lib/api";
import { isDemoUser } from "@/lib/auth-helpers";



export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "", designation: "", employeeId: "",
  });

  // Forgot password modal states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
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

  function openForgot() {
    setForgotIdentifier(user?.email || user?.employeeId || "");
    setForgotPhone(user?.phone || "");
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
      // The user object in context should ideally be refetched, but reloading works.
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

  if (!user) return null;

  const isDemo = isDemoUser(user);
  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  function openEdit() {
    if (isDemo) {
      toast.error("Profile editing is disabled for demo accounts");
      return;
    }
    setForm({
      name: user.name || "", email: user.email || "", phone: user.phone || "",
      department: user.department || "", designation: user.designation || "",
      employeeId: user.employeeId || "",
    });
    setEditOpen(true);
  }

  async function handleSave() {
    if (isDemo) {
      toast.error("Profile editing is disabled for demo accounts");
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        department: form.department.trim(), designation: form.designation.trim(),
      });
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const items = [
    { icon: IdCard,    label: "Employee ID", value: user.employeeId || "—" },
    { icon: Mail,      label: "Email",        value: user.email || "—" },
    { icon: Phone,     label: "Phone",        value: user.phone || "—" },
    { icon: Building2, label: "Department",   value: user.department || "—" },
    { icon: BadgeCheck,label: "Designation",  value: user.designation || "—" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="My profile" description="Your personal & work details." />

      {/* ── Profile bento card ── */}
      <div className="bg-card border border-border/40 rounded-2xl card-shadow overflow-hidden">

        {/* Banner */}
        <div className="h-44 bg-gradient-to-br from-[#001551] via-[#0037b0] to-[#2151da] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 60%, rgba(183,196,255,0.4) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(111,251,190,0.2) 0%, transparent 50%)"
            }}
          />
        </div>

        <div className="px-6 sm:px-8 pb-8 relative">
          {/* Avatar + name row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-12 mb-8 gap-4">
            <div className="flex items-end gap-5">
              <div className="size-24 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
                {initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-2xl font-bold text-foreground">{user.name}</h3>
                  {isDemo && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Demo Mode (Read-Only)
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.designation || "Employee"} · {user.department || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-2 w-full md:w-auto shrink-0 mb-1">
              <button
                onClick={openEdit}
                disabled={isDemo}
                title={isDemo ? "Profile editing is disabled for demo accounts" : "Edit profile"}
                className={cn(
                  "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                  isDemo
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60 border border-border"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-md shadow-primary/20"
                )}
              >
                <Pencil className="size-4" />
                <span className="truncate">Edit profile</span>
              </button>
              <button
                onClick={openForgot}
                disabled={isDemo}
                title={isDemo ? "Password reset is disabled for demo accounts" : "Reset password"}
                className={cn(
                  "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border border-border",
                  isDemo
                    ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    : "bg-card text-foreground hover:bg-muted active:scale-95"
                )}
              >
                <KeyRound className="size-4" />
                <span className="truncate">Reset password</span>
              </button>
              {!user.is2faEnabled && !isDemo && (
                <button
                  onClick={openSetup2fa}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 border border-border bg-card text-foreground px-4 sm:px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted active:scale-95 transition-all whitespace-nowrap"
                >
                  <span className="truncate text-success">Setup 2FA</span>
                </button>
              )}
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/20 hover:bg-muted/50 transition-all"
              >
                <div className="size-10 shrink-0 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-base font-bold text-foreground mt-0.5 truncate" title={value}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-background border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
          <div className="px-8 py-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 bg-muted/30">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Edit Profile</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">Update your personal and work details.</DialogDescription>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-3">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employee ID</Label>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">Locked</span>
                </div>
                <Input value={form.employeeId} disabled className="h-12 bg-muted/50 border-border opacity-70 rounded-xl" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department</Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="h-12 pl-11 bg-card border-border rounded-xl focus-visible:ring-primary shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-border/50 bg-muted/30 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-6 rounded-xl font-semibold border-border hover:bg-muted" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto h-11 px-8 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90">
              Save Profile
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
