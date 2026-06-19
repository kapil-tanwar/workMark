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
  Building, Clock, CalendarDays, Pencil, KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const [profileForm, setProfileForm] = useState({
    name: "", email: "", phone: "", department: "", designation: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    companyName: "", companyEmail: "", workingHours: "", monthlyEarnedAccrual: 1.5,
  });

  useEffect(() => {
    const sync = () => setS(store.getSettings());
    sync();
    window.addEventListener("wf:change", sync);
    return () => window.removeEventListener("wf:change", sync);
  }, []);

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
            <div className="flex flex-wrap gap-2 shrink-0 mb-1">
              <button
                onClick={openEdit}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
              >
                <Pencil className="size-4" />
                Edit Settings &amp; Profile
              </button>
              <Link
                to="/forgot-password"
                className="flex items-center gap-2 border border-border bg-card text-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted active:scale-95 transition-all"
              >
                <KeyRound className="size-4" />
                Forgot password?
              </Link>
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

      {/* Footer */}
      <div className="pt-4 pb-2 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">© 2024 WorkFlow HR Solutions. All rights reserved.</p>
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Settings &amp; Profile</DialogTitle>
            <DialogDescription>Update company configuration and your administrator details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Admin Profile */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b border-border pb-2 text-primary">Admin Personal Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Employee ID</Label>
                  <Input value={user.employeeId} disabled className="opacity-70" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Full Name</Label>
                  <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation</Label>
                  <Input value={profileForm.designation} onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Company Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b border-border pb-2 text-primary">Company &amp; Policy Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Company Name</Label>
                  <Input value={settingsForm.companyName} onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>HR Contact Email</Label>
                  <Input type="email" value={settingsForm.companyEmail} onChange={(e) => setSettingsForm({ ...settingsForm, companyEmail: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Working Hours</Label>
                  <Input value={settingsForm.workingHours} placeholder="09:00 – 18:00" onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Monthly Earned Leave Accrual (days)</Label>
                  <Input
                    type="number" step="0.5" min="0"
                    value={settingsForm.monthlyEarnedAccrual}
                    onChange={(e) => setSettingsForm({ ...settingsForm, monthlyEarnedAccrual: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Added automatically at 00:00:01 on the 1st of every month for active employees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
