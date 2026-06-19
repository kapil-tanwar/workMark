import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/wf-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Building2, BadgeCheck, IdCard, KeyRound, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — WorkFlow HR" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "", designation: "", employeeId: "",
  });

  if (!user) return null;

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  function openEdit() {
    setForm({
      name: user.name || "", email: user.email || "", phone: user.phone || "",
      department: user.department || "", designation: user.designation || "",
      employeeId: user.employeeId || "",
    });
    setEditOpen(true);
  }

  async function handleSave() {
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
                <h3 className="font-headline text-2xl font-bold text-foreground">{user.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {user.designation || "Employee"} · {user.department || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0 mb-1">
              <button
                onClick={openEdit}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
              >
                <Pencil className="size-4" />
                Edit profile
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your personal and work details. Employee ID cannot be changed here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input value={form.employeeId} disabled className="opacity-70" />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
