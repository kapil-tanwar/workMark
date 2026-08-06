import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Loader2, Eye, EyeOff, User, Lock, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/ThemeToggle";



export default function LoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [idFocused, setIdFocused] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(identifier, password);
      if (u.role !== "admin") {
        logout();
        toast.error("Access denied: Admin credentials required.");
        return;
      }
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate("/admin");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground">
      {/* ── Left branding panel ── */}
      <div className="hidden md:flex md:w-[52%] relative overflow-hidden flex-col justify-between p-12 lg:p-16 bg-primary text-primary-foreground">
        {/* Layered background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-primary to-primary/40" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-primary-foreground)_1px,transparent_1px)] bg-size-[24px_24px]" />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px] bg-background/20" />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full blur-[100px] bg-tertiary/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity w-fit"
          >
            <div className="size-12 rounded-xl flex items-center justify-center font-headline font-black text-xl shrink-0 bg-background text-primary">
              <Briefcase className="size-6" />
            </div>
            <span className="font-headline text-2xl font-bold text-primary-foreground">
              WorkFlow HR
            </span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-background/10 text-primary-foreground/80">
            Workforce, Simplified
          </div>

          <h1 className="font-headline text-3xl xl:text-4xl font-bold leading-tight text-primary-foreground">
            Run attendance and leave for your whole team in{" "}
            <span className="text-tertiary">one clean dashboard.</span>
          </h1>

          <p className="text-base leading-relaxed text-primary-foreground/80">
            Real-time tracking, automated reporting, and intuitive request flows designed for modern
            teams.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Active Nodes", value: "12,482", color: "text-tertiary" },
              { label: "Uptime", value: "99.99%", color: "text-primary-foreground" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="p-5 rounded-xl border border-primary-foreground/20 bg-background/10 backdrop-blur-md"
              >
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${color}`}>
                  {label}
                </p>
                <p className="font-headline text-2xl font-bold text-primary-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2 text-primary-foreground">
          <Lock className="size-3" /> Encrypted Portal V4.2.0
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 relative overflow-y-auto bg-card">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 md:hidden">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="size-8 rounded-lg flex items-center justify-center font-headline font-black text-sm bg-primary text-primary-foreground">
              <Briefcase className="size-4" />
            </div>
            <span className="font-headline text-lg font-bold text-primary">WorkFlow HR</span>
          </Link>
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative z-10 w-full max-w-[420px] space-y-7">
          <div>
            <h2 className="font-headline text-3xl font-bold mb-1.5 text-foreground">
              Admin Sign in
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your credentials to access the portal
            </p>
            
            <button
              type="button"
              onClick={() => {
                setIdentifier("admin@demo.com");
                setPassword("password");
              }}
              className="w-full py-2 mb-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
            >
              Demo Admin Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Identifier */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Email or Employee ID
              </label>
              <div className="relative">
                <User
                  className={
                    idFocused
                      ? "text-primary absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors"
                      : "text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors"
                  }
                />
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin@workflow.hr"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold hover:underline underline-offset-2 text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className={
                    pwFocused
                      ? "text-primary absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
                      : "text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
                  }
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            {/* <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-input text-primary focus:ring-primary" />
              <span className="text-sm text-muted-foreground">Remember this device for 30 days</span>
            </label> */}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 bg-primary text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            {/* <span className="text-muted-foreground">
              Need help?{" "}
              <span className="font-semibold cursor-pointer hover:underline text-primary">Contact HR</span>
            </span> */}
            <span className="text-muted-foreground">
              New here?{" "}
              <Link to="/signup" className="font-bold hover:underline text-primary">
                Create account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
