import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, Phone, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { forgotPassword, sendResetOtp } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — WorkFlow HR" }] }),
  component: ForgotPage,
});

const S = {
  bg: "#1e2022", border: "#434655", text: "#e2e2e5",
  placeholder: "#90909a", surface: "#121416", card: "#282a2d",
  primary: "#dde1ff", primaryText: "#071749",
  muted: "#c4c5d7", accent: "#6ffbbe",
  outlineVariant: "rgba(67,70,85,0.4)",
};

function DarkField({ icon: Icon, type = "text", value, onChange, placeholder, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative group">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] pointer-events-none transition-colors"
        style={{ color: focused ? S.primary : S.placeholder }}
      />
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-[52px] pl-12 pr-4 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: "#121416", borderColor: focused ? S.primary : S.border,
          color: S.text, paddingRight: rightSlot ? "2.75rem" : undefined,
          boxShadow: focused ? "0 0 0 2px rgba(221,225,255,0.1)" : "none",
        }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {rightSlot}
    </div>
  );
}

function ForgotPage() {
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [simulatedOtp, setSimulatedOtp] = useState("");

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!identifier || !phone) { toast.error("Please enter email/ID and phone number"); return; }
    setLoading(true);
    try {
      const res = await sendResetOtp({ identifier, phone });
      if (res.otp) setSimulatedOtp(res.otp);
      setStep(2);
      toast.success("OTP sent to WhatsApp/Mobile successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
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
    <div
      className="min-h-screen flex flex-col antialiased"
      style={{
        backgroundColor: S.surface, color: S.text,
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(67,80,131,0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(79,222,163,0.05) 0px, transparent 50%)",
      }}
    >
      {/* Header */}
      <header className="w-full flex items-center justify-center pt-10 pb-2">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="size-10 rounded-xl flex items-center justify-center font-headline font-black text-base"
            style={{ background: S.primary, color: S.primaryText }}>W</div>
          <span className="font-headline text-2xl font-bold" style={{ color: S.primary }}>WorkFlow HR</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-[480px] rounded-2xl border p-8"
          style={{
            background: S.card, borderColor: S.outlineVariant,
            boxShadow: "0 4px 24px -4px rgba(0,0,0,0.4)",
          }}
        >
          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-5 py-4">
              <div className="size-14 mx-auto rounded-full flex items-center justify-center"
                style={{ background: "rgba(111,251,190,0.12)" }}>
                <CheckCircle2 className="size-7" style={{ color: S.accent }} />
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold mb-2" style={{ color: S.text }}>
                  Password Reset Successful
                </h2>
                <p className="text-sm" style={{ color: S.muted }}>
                  Your password has been reset. You can now sign in with your new password.
                </p>
              </div>
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
                style={{ color: S.primary }}>
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="font-headline text-xl font-bold mb-2" style={{ color: S.text }}>
                  {step === 1 ? "Reset password" : "Enter OTP & new password"}
                </h1>
                <p className="text-sm" style={{ color: S.muted }}>
                  {step === 1
                    ? "Enter your details to receive a secure verification code."
                    : "Check your phone/WhatsApp for the 6-digit OTP."}
                </p>
              </div>

              {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>
                      Email or Employee ID
                    </label>
                    <DarkField icon={BadgeCheck} type="text" required
                      placeholder="j.doe@company.com or EMP-1001"
                      value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>
                      Phone Number
                    </label>
                    <DarkField icon={Phone} type="tel" required
                      placeholder="+1 (555) 000-0000"
                      value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60 mt-2"
                    style={{ background: S.primary, color: S.primaryText }}>
                    {loading
                      ? <Loader2 className="size-4 animate-spin" />
                      : <><span>Send Verification OTP</span><ArrowRight className="size-4" /></>
                    }
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* Confirmation block */}
                  <div className="px-4 py-3 rounded-xl border" style={{ background: "#1a1c1e", borderColor: S.border }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: S.muted }}>Sending OTP to</p>
                    <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{identifier}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{phone}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>
                      6-Digit OTP Code
                    </label>
                    <DarkField icon={Lock} type="text" required
                      placeholder="Enter 6-digit OTP"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: S.muted }}>
                      New Password
                    </label>
                    <DarkField
                      icon={Lock} type={showPassword ? "text" : "password"} required
                      placeholder="At least 6 characters"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      rightSlot={
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                          style={{ color: S.placeholder }}>
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      }
                    />
                  </div>

                  {simulatedOtp && (
                    <div className="px-4 py-3 rounded-xl border text-xs"
                      style={{ background: "rgba(221,225,255,0.06)", borderColor: "rgba(221,225,255,0.15)", color: S.primary }}>
                      <p className="font-bold mb-1">OTP Sandbox (dev only)</p>
                      <p>OTP: <span className="font-mono font-bold tracking-widest">{simulatedOtp}</span></p>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-60"
                    style={{ background: S.primary, color: S.primaryText }}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify & Reset Password"}
                  </button>

                  <button type="button" onClick={() => setStep(1)}
                    className="w-full text-center text-xs hover:underline transition-colors"
                    style={{ color: S.muted }}>
                    Change email or phone number
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t flex flex-col items-center gap-3" style={{ borderColor: S.outlineVariant }}>
                <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
                  style={{ color: S.primary }}>
                  <ArrowLeft className="size-4" /> Back to login
                </Link>
                <p className="text-xs text-center max-w-[300px]" style={{ color: "#6b6d7e" }}>
                  No access to your registered contact methods?{" "}
                  <span className="font-semibold cursor-pointer" style={{ color: S.primary }}>Contact HR Admin</span>
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
