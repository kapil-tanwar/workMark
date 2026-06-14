import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/wf-ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Phone, Building2, BadgeCheck, IdCard, KeyRound, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — WorkFlow HR" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
  });

  if (!user) return null;

  function openEdit() {
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      department: user.department || "",
      designation: user.designation || "",
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
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
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
    { icon: IdCard, label: "Employee ID", value: user.employeeId || "—" },
    { icon: Mail, label: "Email", value: user.email || "—" },
    { icon: Phone, label: "Phone", value: user.phone || "—" },
    { icon: Building2, label: "Department", value: user.department || "—" },
    { icon: BadgeCheck, label: "Designation", value: user.designation || "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="Your personal & work details." />
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
                {user.designation} · {user.department}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button variant="default" onClick={openEdit}>
                <Pencil className="size-4" />
                Edit profile
              </Button>
              <Button variant="outline" asChild>
                <Link to="/forgot-password">
                  <KeyRound className="size-4" />
                  Forgot password?
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it) => {
              const Icon = it.icon;
              return (
                <div
                  key={it.label}
                  className="group flex items-center gap-4 p-5 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="size-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {it.label}
                    </p>
                    <p className="text-base font-semibold mt-1 truncate" title={it.value}>
                      {it.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your personal and work details. Employee ID cannot be changed here.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
            <Button variant="outline" onClick={() => setEditOpen(false)}>
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
