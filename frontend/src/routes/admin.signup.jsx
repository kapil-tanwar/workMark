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
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getToken } from "@/lib/api";
import { toast } from "sonner";
import { getSavedUser } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/ThemeToggle";



export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phone, setPhone] = useState("");
  const role = "admin";
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
      const result = await signup({ name, email, password, role, employeeId, phone });
      if (result.pending) {
        toast.success(
          result.message || "Your admin account request has been submitted for approval.",
        );
        navigate("/admin/login");
      } else {
        toast.success("Account created!");
        navigate("/admin");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* ── Left branding panel ── */}
      <div className="hidden md:flex md:w-[44%] lg:w-[48%] relative overflow-hidden flex-col justify-between p-12 lg:p-16 bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-primary to-primary/40" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,var(--color-primary-foreground)_1px,transparent_1px)] bg-size-[24px_24px]" />
          <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full blur-[110px] bg-background/20" />
          <div className="absolute bottom-1/3 left-0 w-52 h-52 rounded-full blur-[90px] bg-tertiary/20" />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="space-y-8">
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

            <div>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold leading-tight mb-4 text-primary-foreground">
                Join WorkFlow HR
              </h1>
              <p className="text-base leading-relaxed text-primary-foreground/80">
                The ultimate HR ecosystem for high-efficiency teams. Streamline attendance, leaves,
                and reporting in one place.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-5 pt-4">
              {[
                {
                  icon: Shield,
                  title: "Secure & Encrypted",
                  desc: "Enterprise-grade protection for your sensitive data.",
                },
                {
                  icon: Zap,
                  title: "Real-time Sync",
                  desc: "Stay updated with instant notifications across the portal.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="size-11 rounded-xl flex items-center justify-center shrink-0 border border-primary-foreground/20 bg-background/10 backdrop-blur-md">
                    <Icon className="size-5 text-tertiary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-0.5 text-primary-foreground">{title}</h3>
                    <p className="text-sm text-primary-foreground/80">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2 text-primary-foreground">
            <Lock className="size-3" /> Encrypted Portal V4.2.0
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:px-12 lg:px-16 relative overflow-y-auto bg-card">
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

        <div className="absolute inset-0 opacity-[0.025] pointer-events-none bg-[radial-gradient(var(--color-primary)_1px,transparent_1px)] bg-size-[24px_24px]" />

        <div className="relative z-10 w-full max-w-110 space-y-6">
          <div className="hidden md:block">
            <h2 className="font-headline text-3xl font-bold mb-1.5 text-foreground">
              Admin Create Account
            </h2>
            <p className="text-sm text-muted-foreground">Join the WorkFlow HR ecosystem</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Full name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  onFocus={() => setNameFocus(true)}
                  onBlur={() => setNameFocus(false)}
                />
              </div>
            </div>

            {/* Employee ID + Phone — side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    onFocus={() => setIdFocus(true)}
                    onBlur={() => setIdFocus(false)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                    className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
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
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm border outline-none transition-all bg-background border-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
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
