import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BadgeCheck, Phone, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { forgotPassword } from "@/lib/api";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Scene3D } from "@/components/three/Scene3D";
import { BrandLockup } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth-context";



export default function ForgotPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [idFocus, setIdFocus] = useState(false);
  const [phoneFocus, setPhoneFocus] = useState(false);
  const [otpFocus, setOtpFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);

  const backLink = user ? (user.role === 'admin' ? '/admin/settings' : '/profile') : '/login';
  const backText = user ? "Back to settings" : "Back to login";


  async function handleResetPassword(e) {
    e.preventDefault();
    const normId = identifier.trim().toLowerCase();
    if (
      normId === "admin@admin.com" ||
      normId === "employee@employee.com" ||
      normId === "admin00" ||
      normId === "employee00" ||
      normId === "admin11111@demo.com" ||
      normId === "employee@demo.com"
    ) {
      toast.error("Password reset is disabled for demo accounts");
      return;
    }
    if (!otp || !newPassword) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      await forgotPassword({ identifier, phone, otp, newPassword });
      setSent(true);
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col antialiased bg-background text-foreground relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 ambient pointer-events-none" />
      <Scene3D variant="wave" className="opacity-60" />

      {/* Header/Navbar */}
      <header className="w-full flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-50">
        <Link to="/"><BrandLockup /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-[460px] rounded-3xl p-8 sm:p-9 glass-card">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-5 py-4">
              <div className="size-14 mx-auto rounded-full flex items-center justify-center bg-success/10 text-success">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold mb-2 text-foreground">
                  Password Reset Successful
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset. You can now sign in with your new password.
                </p>
              </div>
              <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline text-primary">
                <ArrowLeft className="size-4" /> {backText}
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-headline text-xl font-bold mb-2 text-foreground">
                  Reset password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your details and your Google Authenticator code to reset your password.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email or Employee ID
                  </label>
                  <div className="relative">
                    <BadgeCheck className={`absolute left-4 top-1/2 -translate-y-1/2 size-[18px] pointer-events-none transition-colors ${idFocus ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input type="text" required placeholder=" Email or EMP ID"
                      value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full h-[52px] pl-12 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                      onFocus={() => setIdFocus(true)} onBlur={() => setIdFocus(false)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 size-[18px] pointer-events-none transition-colors ${phoneFocus ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input type="tel" required placeholder="+919876543210"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-[52px] pl-12 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                      onFocus={() => setPhoneFocus(true)} onBlur={() => setPhoneFocus(false)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Google Auth Code
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 size-[18px] pointer-events-none transition-colors ${otpFocus ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input type="text" required placeholder="6-digit code"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full h-[52px] pl-12 pr-4 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                      onFocus={() => setOtpFocus(true)} onBlur={() => setOtpFocus(false)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 size-[18px] pointer-events-none transition-colors ${pwFocus ? 'text-primary' : 'text-muted-foreground'}`} />
                    <input type={showPassword ? "text" : "password"} required placeholder="At least 6 characters"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-[52px] pl-12 pr-11 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm"
                      onFocus={() => setPwFocus(true)} onBlur={() => setPwFocus(false)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity text-muted-foreground">
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-60 btn-glow text-primary-foreground">
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify & Reset Password"}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t flex flex-col items-center gap-3 border-border/50">
                <Link to={backLink} className="flex items-center gap-1.5 text-sm font-semibold hover:underline text-primary">
                  <ArrowLeft className="size-4" /> {backText}
                </Link>
                <p className="text-xs text-center max-w-[300px] text-muted-foreground">
                  No access to your registered contact methods?{" "}
                  <span className="font-semibold cursor-pointer text-primary">Contact HR Admin</span>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
