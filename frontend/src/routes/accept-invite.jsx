import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ArrowRight, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getInvite, acceptInvite } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Scene3D } from "@/components/three/Scene3D";
import { BrandLockup } from "@/components/BrandMark";

const inputCls =
  "w-full h-[52px] pl-12 pr-11 rounded-xl text-sm border outline-none transition-all bg-surface border-input text-foreground hover:border-foreground/25 focus:border-ring focus:ring-4 focus:ring-ring/15 shadow-sm";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const [state, setState] = useState("loading"); // loading | ready | invalid | done
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvite(token)
      .then((i) => { if (!cancelled) { setInvite(i); setState("ready"); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setState("invalid"); } });
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    try {
      await acceptInvite(token, password);
      setState("done");
    } catch (err) {
      toast.error(err.message);
      if (/invalid or has expired/i.test(err.message)) { setError(err.message); setState("invalid"); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col antialiased bg-background text-foreground relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 ambient pointer-events-none" />
      <Scene3D variant="wave" className="opacity-60" />
      <header className="w-full flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-50">
        <Link to="/"><BrandLockup /></Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-[460px] rounded-3xl p-8 sm:p-9 glass-card">
          {state === "loading" && (
            <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground" role="status">
              <Loader2 className="size-7 animate-spin text-primary" />
              <p className="text-sm">Checking your invitation…</p>
            </div>
          )}

          {state === "invalid" && (
            <div className="text-center space-y-5 py-4">
              <div className="size-14 mx-auto rounded-full flex items-center justify-center bg-destructive/10 text-destructive"><XCircle className="size-7" /></div>
              <div>
                <h1 className="font-headline text-xl font-bold mb-2">Invitation unavailable</h1>
                <p className="text-sm text-muted-foreground">{error || "This invitation link is invalid or has expired."}</p>
              </div>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline text-primary">Go to sign in <ArrowRight className="size-4" /></Link>
            </div>
          )}

          {state === "done" && (
            <div className="text-center space-y-5 py-4">
              <div className="size-14 mx-auto rounded-full flex items-center justify-center bg-success/10 text-success"><CheckCircle2 className="size-7" /></div>
              <div>
                <h1 className="font-headline text-xl font-bold mb-2">You're all set</h1>
                <p className="text-sm text-muted-foreground">Your password has been created. Sign in with your Employee ID{invite?.email ? " or email" : ""}.</p>
              </div>
              <Link to="/login" className="btn-glow inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl text-sm font-bold">Sign in <ArrowRight className="size-4" /></Link>
            </div>
          )}

          {state === "ready" && (
            <>
              <div className="text-center mb-8">
                <h1 className="font-headline text-xl font-bold mb-2">Welcome, {invite.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Create a password to activate your WorkMark account. Your Employee ID is <span className="font-mono font-semibold text-foreground">{invite.employeeId}</span>.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="pw" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
                    <input id="pw" type={show ? "text" : "password"} required minLength={6} autoComplete="new-password" placeholder="At least 6 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70 text-muted-foreground">
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="pw2" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-muted-foreground pointer-events-none" />
                    <input id="pw2" type={show ? "text" : "password"} required autoComplete="new-password" placeholder="Re-enter password"
                      value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
                  </div>
                  {confirm && password !== confirm && <p className="text-xs text-destructive" role="alert">Passwords do not match</p>}
                </div>
                <button type="submit" disabled={saving}
                  className="w-full h-[52px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:brightness-110 disabled:opacity-60 btn-glow">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Activate my account"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
