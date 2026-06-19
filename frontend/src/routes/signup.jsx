import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Eye, EyeOff, Shield, Zap, User, Mail, Phone, CreditCard, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";

export const Route = createFileRoute("/signup")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("wf_token");
    const user = getSavedUser();
    if (token && user) throw redirect({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  },
  head: () => ({ meta: [{ title: "Create account — WorkFlow HR" }] }),
  component: SignupPage,
});

/* ── Shared palette ── */
const S = {
  bg: "#1e2022",
  border: "#434655",
  text: "#e2e2e5",
  placeholder: "#90909a",
  surface: "#121416",
  primary: "#dde1ff",
  primaryText: "#071749",
  muted: "#c4c5d7",
  accent: "#6ffbbe",
  outlineVariant: "rgba(67,70,85,0.4)",
};

/* ── Reusable dark input ── */
function DarkInput({ icon: Icon, className = "", rightSlot, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none z-10"
        style={{ color: focused ? S.primary : S.placeholder }} />
      <input
        {...props}
        className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: S.bg, borderColor: focused ? S.primary : S.border, color: S.text,
          boxShadow: focused ? "0 0 0 1px rgba(221,225,255,0.2)" : "none",
          paddingRight: rightSlot ? "2.75rem" : "1rem",
        }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {rightSlot}
    </div>
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await signup({ name, email, password, role, employeeId, phone });
      toast.success("Account created!");
      navigate({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: S.surface, color: S.text }}>

      {/* ── Left branding panel ── */}
      <div className="hidden md:flex md:w-[44%] lg:w-[48%] relative overflow-hidden flex-col justify-between p-12 lg:p-16"
        style={{ backgroundColor: "#0c0e10" }}>

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "linear-gradient(145deg, rgba(7,23,73,0.92) 0%, rgba(12,14,16,0.5) 50%, rgba(0,60,35,0.35) 100%)"
          }} />
          <div className="absolute inset-0 opacity-[0.035]" style={{
            backgroundImage: "radial-gradient(#dde1ff 1px, transparent 1px)", backgroundSize: "22px 22px"
          }} />
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full blur-[110px]" style={{ background: "rgba(183,196,255,0.10)" }} />
          <div className="absolute bottom-1/3 left-0 w-52 h-52 rounded-full blur-[90px]" style={{ background: "rgba(111,251,190,0.08)" }} />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl flex items-center justify-center font-headline font-black text-xl shrink-0"
                style={{ background: S.primary, color: S.primaryText }}>W</div>
              <span className="font-headline text-2xl font-bold" style={{ color: S.primary }}>WorkFlow HR</span>
            </div>

            <div>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold leading-tight mb-4" style={{ color: S.primary }}>
                Join WorkFlow HR
              </h1>
              <p className="text-base leading-relaxed" style={{ color: S.muted }}>
                The ultimate HR ecosystem for high-efficiency teams. Streamline attendance, leaves, and reporting in one place.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-5 pt-4">
              {[
                { icon: Shield, iconBg: "#424479", iconColor: "#b2b3f0", title: "Secure & Encrypted", desc: "Enterprise-grade protection for your sensitive data." },
                { icon: Zap, iconBg: "#005f40", iconColor: "#6ffbbe", title: "Real-time Sync", desc: "Stay updated with instant notifications across the portal." },
              ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
                    <Icon className="size-5" style={{ color: iconColor }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-0.5" style={{ color: "#e2e2e5" }}>{title}</h3>
                    <p className="text-sm" style={{ color: S.muted }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest opacity-25 flex items-center gap-2" style={{ color: S.muted }}>
            <Lock className="size-3" /> Encrypted Portal V4.2.0
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-16 relative overflow-y-auto"
        style={{ backgroundColor: S.surface }}>

        {/* Mobile logo */}
        <div className="flex items-center gap-2 md:hidden mb-8 self-start">
          <div className="size-9 rounded-lg flex items-center justify-center font-headline font-black text-sm"
            style={{ background: S.primary, color: S.primaryText }}>W</div>
          <span className="font-headline text-lg font-bold" style={{ color: S.primary }}>WorkFlow HR</span>
        </div>

        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#dde1ff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 w-full max-w-[440px] space-y-6">
          <div className="hidden md:block">
            <h2 className="font-headline text-3xl font-bold mb-1.5" style={{ color: "#e2e2e5" }}>Create Account</h2>
            <p className="text-sm" style={{ color: S.muted }}>Join the WorkFlow HR ecosystem</p>
          </div>

          <form onSubmit={submit} className="space-y-4">

            {/* Role toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>I am signing up as</label>
              <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl border"
                style={{ background: "#1a1c1e", borderColor: S.border }}>
                {[{ v: "employee", l: "Employee" }, { v: "admin", l: "Admin / HR" }].map(({ v, l }) => (
                  <button key={v} type="button" onClick={() => setRole(v)}
                    className="py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                    style={role === v
                      ? { background: "#dce1ff", color: S.primaryText }
                      : { color: S.muted, background: "transparent" }
                    }>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>Full Name</label>
              <DarkInput icon={User} type="text" required placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Employee ID + Phone — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>Employee ID</label>
                <DarkInput icon={CreditCard} type="text" required placeholder="ID-12345"
                  value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>Phone</label>
                <DarkInput icon={Phone} type="tel" required placeholder="+1 234 567"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest flex justify-between" style={{ color: S.muted }}>
                Email <span className="opacity-60 normal-case font-normal">Optional</span>
              </label>
              <DarkInput icon={Mail} type="email" placeholder="name@company.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: S.muted }}>Password</label>
              <DarkInput
                icon={Lock} type={showPassword ? "text" : "password"} required minLength={6}
                placeholder="At least 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightSlot={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity z-10"
                    style={{ color: S.placeholder }}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
              <p className="text-[11px]" style={{ color: "#6b6d7e" }}>At least 6 characters.</p>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background: "#dce1ff", color: S.primaryText }}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: S.muted }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold hover:underline" style={{ color: S.primary }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
