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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  IdCard,
  Building,
  Clock,
  CalendarDays,
  Pencil,
  KeyRound,
} from "lucide-react";

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
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
  });

  const [settingsForm, setSettingsForm] = useState({
    companyName: "",
    companyEmail: "",
    workingHours: "",
    monthlyEarnedAccrual: 1.5,
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
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      department: user.department || "",
      designation: user.designation || "",
    });
    setSettingsForm({
      companyName: s.companyName || "",
      companyEmail: s.companyEmail || "",
      workingHours: s.workingHours || "",
      monthlyEarnedAccrual: s.monthlyEarnedAccrual ?? 1.5,
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
      // 1. Update personal admin profile
      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        department: profileForm.department.trim(),
        designation: profileForm.designation.trim(),
      });
      // 2. Update company settings
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

  const profileItems = [
    { icon: IdCard, label: "Employee ID", value: user.employeeId || "—" },
    { icon: Mail, label: "Email", value: user.email || "—" },
    { icon: Phone, label: "Phone", value: user.phone || "—" },
    { icon: Building2, label: "Department", value: user.department || "—" },
    { icon: BadgeCheck, label: "Designation", value: user.designation || "—" },
  ];

  const settingItems = [
    { icon: Building, label: "Company Name", value: s.companyName || "—" },
    { icon: Mail, label: "HR Contact Email", value: s.companyEmail || "—" },
    { icon: Clock, label: "Working Hours", value: s.workingHours || "—" },
    { icon: CalendarDays, label: "Monthly Leave Accrual", value: `${s.monthlyEarnedAccrual ?? 1.5} days` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Company info, leave policies, and admin profile details." />
      
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-br from-primary via-primary to-info" />
        <div className="px-6 sm:px-8 pb-8 -mt-14">
          <Avatar className="size-24 ring-4 ring-card shadow-md">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user.designation || "Administrator"} · {user.department || "Administration"} (Admin Portal)
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="default" onClick={openEdit}>
                <Pencil className="size-4" />
                Edit Settings & Profile
              </Button>
              <Button variant="outline" asChild>
                <Link to="/forgot-password">
                  <KeyRound className="size-4" />
                  Forgot password?
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Admin Profile Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">Admin Profile Details</h3>
              <div className="grid grid-cols-1 gap-4">
                {profileItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <div
                      key={it.label}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="size-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {it.label}
                        </p>
                        <p className="text-sm font-semibold mt-0.5 truncate" title={it.value}>
                          {it.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Company Settings Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold tracking-tight">Company & Leave Policy Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                {settingItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <div
                      key={it.label}
                      className="group flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="size-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {it.label}
                        </p>
                        <p className="text-sm font-semibold mt-0.5 truncate" title={it.value}>
                          {it.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Settings & Profile</DialogTitle>
            <DialogDescription>Update both company configuration and your administrator details.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Admin Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b pb-1 text-primary">Admin Personal Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Employee ID</Label>
                  <Input value={user.employeeId} disabled className="opacity-80" />
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

            {/* Company Settings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold border-b pb-1 text-primary">Company & Policy Configurations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Company Name</Label>
                  <Input value={settingsForm.companyName} onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>HR Email</Label>
                  <Input type="email" value={settingsForm.companyEmail} onChange={(e) => setSettingsForm({ ...settingsForm, companyEmail: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Working Hours</Label>
                  <Input value={settingsForm.workingHours} onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Monthly Earned Leave Accrual (days)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={settingsForm.monthlyEarnedAccrual}
                    onChange={(e) => setSettingsForm({ ...settingsForm, monthlyEarnedAccrual: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Added automatically at 00:00:01 on the 1st of every month for active employees.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
