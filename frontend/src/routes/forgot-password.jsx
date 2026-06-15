import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, UserRound, Phone, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/api";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/forgot-password")({
    head: () => ({ meta: [{ title: "Forgot password — WorkFlow HR" }] }),
    component: ForgotPage,
});

function ForgotPage() {
    const [identifier, setIdentifier] = useState("");
    const [phone, setPhone] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    return (<div className="min-h-screen flex items-center justify-center p-6 bg-muted/30 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl shadow-sm p-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity w-fit">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Briefcase className="size-5"/>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">WorkFlow HR</h1>
        </Link>

        {sent ? (<div className="mt-8 text-center">
            <div className="size-12 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="size-6"/>
            </div>
            <h2 className="text-xl font-semibold mt-4">Password Reset Successful</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link to="/login" className="inline-flex items-center gap-1 mt-6 text-sm text-primary font-medium hover:underline">
              <ArrowLeft className="size-4"/> Back to sign in
            </Link>
          </div>) : (<>
            <h2 className="text-2xl font-semibold mt-6">Reset password</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Verify your identity to reset your password.
            </p>
            <form className="mt-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                    await forgotPassword({ identifier, phone, newPassword });
                    setSent(true);
                    toast.success("Password reset successfully");
                } catch (err) {
                    toast.error(err.message);
                } finally {
                    setLoading(false);
                }
            }}>
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Email or Employee ID</Label>
                <div className="relative">
                  <UserRound className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="identifier" type="text" required className="pl-10 h-11" placeholder="you@company.com or EMP-1001" value={identifier} onChange={(e) => setIdentifier(e.target.value)}/>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="phone" type="tel" required className="pl-10 h-11" placeholder="+1 (555) 010-0000" value={phone} onChange={(e) => setPhone(e.target.value)}/>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="newPassword" type={showPassword ? "text" : "password"} required minLength={6} className="pl-10 pr-10 h-11" placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Reset password"}
              </Button>
            </form>
            <Link to="/login" className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4"/> Back to sign in
            </Link>
          </>)}
      </div>
    </div>);
}
