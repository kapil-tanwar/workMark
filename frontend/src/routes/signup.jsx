import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Mail, Lock, User as UserIcon, Loader2, IdCard, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getSavedUser } from "@/lib/auth-helpers";


export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("wf_token");
    const user = getSavedUser();
    if (token && user) {
      throw redirect({ to: user.role === "admin" ? "/admin" : "/dashboard" });
    }
  },
  head: () => ({ meta: [{ title: "Create account — WorkFlow HR" }] }),
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated()) return;
    const user = getStoredUser();
    throw redirect({ to: user?.role === "admin" ? "/admin" : "/dashboard", replace: true });
  },
  component: SignupPage,
});

function SignupAside() {
  return (
    <>
      <h3 className="text-3xl font-bold leading-tight">Join WorkFlow HR</h3>
      <p className="mt-4 text-white/80 text-base xl:text-lg">
        One account for attendance, leave requests, and team management.
      </p>
    </>
  );
}

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("employee");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await signup({ name, email, password, role, employeeId, phone });
      toast.success("Account created");
      await navigate({ to: u.role === "admin" ? "/admin" : "/dashboard", replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout aside={<SignupAside />}>
      <div className="flex items-center gap-2">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
          <Briefcase className="size-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">WorkFlow HR</h1>
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8">Create your account</h2>
      <p className="text-sm text-muted-foreground mt-1">Get started in seconds — pick the portal you need.</p>

      <form onSubmit={submit} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <UserIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" required className="pl-10 h-11" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email (optional)</Label>
          <div className="relative">
            <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" className="pl-10 h-11" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" type="tel" required className="pl-10 h-11" placeholder="+1 (555) 010-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employeeId">Employee ID</Label>
          <div className="relative">
            <IdCard className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="employeeId" required className="pl-10 h-11 uppercase" placeholder="EMP-1001" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">Used to sign in — required for employees and admins.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" type="password" required minLength={6} className="pl-10 h-11" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>I am signing up as</Label>
          <RadioGroup value={role} onValueChange={(v) => setRole(v)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label htmlFor="role-emp" className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${role === "employee" ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/40"}`}>
              <RadioGroupItem id="role-emp" value="employee" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Employee</div>
                <div className="text-xs text-muted-foreground">Check-in and request leave</div>
              </div>
            </label>
            <label htmlFor="role-adm" className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${role === "admin" ? "border-primary bg-primary-soft" : "border-border hover:bg-muted/40"}`}>
              <RadioGroupItem id="role-adm" value="admin" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Admin / HR</div>
                <div className="text-xs text-muted-foreground">Manage team and approve</div>
              </div>
            </label>
          </RadioGroup>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold">
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
