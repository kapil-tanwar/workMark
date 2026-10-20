import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Zap,
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStage } from "@/components/auth/AuthStage";
import { BrandLockup } from "@/components/BrandMark";



export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const role = "employee";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameFocus, setNameFocus] = useState(false);
  const [idFocus, setIdFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await signup({ name, email, password, role, employeeId, phone });
      toast.success("Account created!");
      navigate(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* ── Left branding panel ── */}
      <AuthStage className="md:w-[44%] lg:w-[48%]" eyebrow="Create your account" headline={<>Join WorkMark and <span className="text-[#4fe0b0]">mark every day.</span></>} sub="Set up in minutes. Check in, request leave and stay in sync with your team." stats={[]} />

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-16 relative overflow-y-auto bg-card">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Mobile logo */}
        <div className="absolute top-6 left-6 md:hidden">
          <Link to="/"><BrandLockup /></Link>
        </div>

        <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative z-10 w-full max-w-110 space-y-6">
          <div className="hidden md:block">
            <h2 className="font-headline text-3xl font-semibold tracking-[-0.03em] mb-1.5 text-foreground">
              Create Account
            </h2>
            <p className="text-sm text-muted-foreground">Join the WorkMark ecosystem</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Full name */}
            <div className="space-y-2">
              <label className="eyebrow">
                Full Name
              </label>
              <div className="relative">
                <User
                  className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors ${nameFocus ? "text-primary" : "text-muted-foreground"}`}
                />
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                  onFocus={() => setNameFocus(true)}
                  onBlur={() => setNameFocus(false)}
                />
              </div>
            </div>

            {/* Employee ID + Phone — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="eyebrow">
                  Employee ID
                </label>
                <div className="relative">
                  <CreditCard
                    className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors ${idFocus ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <input
                    type="text"
                    required
                    placeholder="EMP-123"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                    onFocus={() => setIdFocus(true)}
                    onBlur={() => setIdFocus(false)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="eyebrow">
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors ${phoneFocus ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                    onFocus={() => setPhoneFocus(true)}
                    onBlur={() => setPhoneFocus(false)}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest flex justify-between text-muted-foreground">
                Email <span className="opacity-60 normal-case font-normal">Optional</span>
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors ${emailFocus ? "text-primary" : "text-muted-foreground"}`}
                />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="eyebrow">
                Password
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 pointer-events-none transition-colors ${pwFocus ? "text-primary" : "text-muted-foreground"}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-80 transition-opacity text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">
                At least 6 characters.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 mt-1 bg-primary text-primary-foreground"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-bold hover:underline text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
