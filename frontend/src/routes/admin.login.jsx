import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Loader2, Eye, EyeOff, User, Lock, } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStage } from "@/components/auth/AuthStage";
import { BrandLockup } from "@/components/BrandMark";



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
      <AuthStage className="md:w-[52%]" eyebrow="Admin console" headline={<>Command your workforce with <span className="text-[#4fe0b0]">total clarity.</span></>} sub="Approve leave, monitor attendance and generate reports from a single secure control room." stats={[{ label: "Live roster", value: "Real-time" }, { label: "Access", value: "Role-based" }]} />

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 relative overflow-y-auto bg-card">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 md:hidden">
          <Link to="/"><BrandLockup /></Link>
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative z-10 w-full max-w-[420px] space-y-7">
          <div>
            <h2 className="font-headline text-3xl font-semibold tracking-[-0.03em] mb-1.5 text-foreground">
              Admin Sign in
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your credentials to access the portal
            </p>
            
            <button
              type="button"
              onClick={() => {
                setIdentifier("admin@admin.com");
                setPassword("password");
              }}
              className="w-full py-2 mb-2 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
            >
              Demo Admin Account (admin00)
            </button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Identifier */}
            <div className="space-y-2">
              <label className="block eyebrow">
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
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                  onFocus={() => setIdFocused(true)}
                  onBlur={() => setIdFocused(false)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="eyebrow">
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
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
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
              className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-60 btn-glow text-primary-foreground"
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
              <Link to="/admin/signup" className="font-bold hover:underline text-primary">
                Create account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
