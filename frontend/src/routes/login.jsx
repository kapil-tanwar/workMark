import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, Eye, EyeOff, User, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("wf_token");
    const user = getSavedUser();
    if (token && user) throw redirect({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — WorkFlow HR" },
      { name: "description", content: "Sign in to your WorkFlow HR portal." },
    ],
  }),
  component: LoginPage,
});

/* ── Shared input styles ── */
const S = {
  bg: "#1e2022",
  border: "#434655",
  text: "#e2e2e5",
  placeholder: "#90909a",
  surface: "#121416",
  card: "#1a1c1e",
  primary: "#dde1ff",
  primaryText: "#071749",
  muted: "#c4c5d7",
  accent: "#6ffbbe",
  outlineVariant: "rgba(67,70,85,0.4)",
};

function DarkInput({ icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
        style={{ color: focused ? S.primary : S.placeholder }}
      />
      <input
        {...props}
        className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: S.bg,
          borderColor: focused ? S.primary : S.border,
          color: S.text,
          boxShadow: focused ? `0 0 0 1px rgba(221,225,255,0.2)` : "none",
        }}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      />
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

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
    <div
      className="min-h-screen w-full flex flex-col md:flex-row"
      style={{ backgroundColor: S.surface, color: S.text }}
    >
      {/* ── Left branding panel ── */}
      <div
        className="hidden md:flex md:w-[52%] relative overflow-hidden flex-col justify-between p-12 lg:p-16"
        style={{ backgroundColor: "#0c0e10" }}
      >
        {/* Layered background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(7,23,73,0.95) 0%, rgba(18,20,22,0.55) 60%, rgba(5,50,30,0.35) 100%)"
          }} />
          <div className="absolute inset-0 opacity-[0.035]" style={{
            backgroundImage: "radial-gradient(#dde1ff 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }} />
          <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-[120px]" style={{ background: "rgba(183,196,255,0.10)" }} />
          <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full blur-[100px]" style={{ background: "rgba(111,251,190,0.07)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl flex items-center justify-center font-headline font-black text-xl shrink-0"
              style={{ background: S.primary, color: S.primaryText }}>W</div>
            <span className="font-headline text-2xl font-bold" style={{ color: S.primary }}>WorkFlow HR</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(255,255,255,0.07)", color: S.muted }}>
            Workforce, Simplified
          </div>

          <h1 className="font-headline text-3xl xl:text-4xl font-bold leading-tight" style={{ color: "#e2e2e5" }}>
            Run attendance and leave for your whole team in{" "}
            <span style={{ color: S.accent }}>one clean dashboard.</span>
          </h1>

          <p className="text-base leading-relaxed" style={{ color: S.muted }}>
            Real-time tracking, automated reporting, and intuitive request flows designed for modern teams.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Active Nodes", value: "12,482", color: S.accent },
              { label: "Uptime", value: "99.99%", color: S.primary },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-5 rounded-xl border"
                style={{ background: "rgba(30,32,34,0.7)", borderColor: S.outlineVariant, backdropFilter: "blur(12px)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>{label}</p>
                <p className="font-headline text-2xl font-bold" style={{ color: "#e2e2e5" }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] font-bold uppercase tracking-widest opacity-25 flex items-center gap-2" style={{ color: S.muted }}>
          <Lock className="size-3" /> Encrypted Portal V4.2.0
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 md:px-12 relative overflow-y-auto"
        style={{ backgroundColor: S.surface }}
      >
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 md:hidden">
          <div className="size-8 rounded-lg flex items-center justify-center font-headline font-black text-sm"
            style={{ background: S.primary, color: S.primaryText }}>W</div>
          <span className="font-headline text-lg font-bold" style={{ color: S.primary }}>WorkFlow HR</span>
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#dde1ff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 w-full max-w-[420px] space-y-7">
          <div>
            <h2 className="font-headline text-3xl font-bold mb-1.5" style={{ color: "#e2e2e5" }}>Sign in</h2>
            <p className="text-sm" style={{ color: S.muted }}>Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            {/* Identifier */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>
                Email or Employee ID
              </label>
              <DarkInput
                icon={User} id="identifier" type="text" required
                autoComplete="username" placeholder="admin@workflow.hr"
                value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold hover:underline underline-offset-2" style={{ color: S.primary }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
                  style={{ color: pwFocused ? S.primary : S.placeholder }}
                />
                <input
                  id="password" type={showPassword ? "text" : "password"} required
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm border outline-none transition-all"
                  style={{
                    background: S.bg,
                    borderColor: pwFocused ? S.primary : S.border,
                    color: S.text,
                    boxShadow: pwFocused ? `0 0 0 1px rgba(221,225,255,0.2)` : "none",
                  }}
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity"
                  style={{ color: S.placeholder }}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded"
                style={{ accentColor: S.primary }} />
              <span className="text-sm" style={{ color: S.muted }}>Remember this device for 30 days</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60"
              style={{ background: S.primary, color: S.primaryText }}>
              {loading
                ? <Loader2 className="size-4 animate-spin" />
                : <><span>Sign in to Dashboard</span><ArrowRight className="size-4" /></>
              }
            </button>
          </form>

          {/* Footer */}
          <div className="pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"
            style={{ borderColor: "rgba(67,70,85,0.3)" }}>
            <span style={{ color: S.muted }}>
              Need help?{" "}
              <span className="font-semibold cursor-pointer hover:underline" style={{ color: S.accent }}>Contact HR</span>
            </span>
            <span style={{ color: S.muted }}>
              New here?{" "}
              <Link to="/signup" className="font-bold hover:underline" style={{ color: S.primary }}>Create account</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
