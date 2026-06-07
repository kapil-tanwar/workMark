import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, UserRound, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — WorkFlow HR" },
      { name: "description", content: "Sign in to your WorkFlow HR portal to manage attendance and leaves." },
    ],
  }),
  component: LoginPage,
});

function LoginAside() {
  return (
    <>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider">
        Workforce, simplified
      </div>
      <h3 className="mt-6 text-3xl xl:text-4xl font-bold leading-tight">
        Run attendance and leave for your whole team in one clean dashboard.
      </h3>
      <p className="mt-4 text-white/80 text-base xl:text-lg">
        Check in, request time off, and approve leaves in seconds — built for modern teams.
      </p>
    </>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(identifier, password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout aside={<LoginAside />}>
      <div className="flex items-center gap-2 mb-2">
        <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
          <Briefcase className="size-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">WorkFlow HR</h1>
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold mt-6 sm:mt-8">Welcome back</h2>
      <p className="text-sm text-muted-foreground mt-1">Sign in to access your attendance and leave dashboard.</p>

      <form onSubmit={submit} className="mt-6 sm:mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="identifier">Email or Employee ID</Label>
          <div className="relative">
            <UserRound className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="name@company.com or EMP-1001"
              className="pl-10 h-11"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-2">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline shrink-0">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              className="pl-10 h-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Remember me for 30 days
          </Label>
        </div>
        <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <>Sign in <ArrowRight className="size-4 ml-1" /></>}
        </Button>
      </form>

      <p className="mt-6 sm:mt-8 text-center text-sm text-muted-foreground">
        New to WorkFlow HR?{" "}
        <Link to="/signup" className="text-primary font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
