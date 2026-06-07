import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
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
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    return (<div className="min-h-screen flex items-center justify-center p-6 bg-muted/30 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Briefcase className="size-5"/>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">WorkFlow HR</h1>
        </div>

        {sent ? (<div className="mt-8 text-center">
            <div className="size-12 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="size-6"/>
            </div>
            <h2 className="text-xl font-semibold mt-4">Check your inbox</h2>
            <p className="text-sm text-muted-foreground mt-2">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link.
            </p>
            <Link to="/login" className="inline-flex items-center gap-1 mt-6 text-sm text-primary font-medium hover:underline">
              <ArrowLeft className="size-4"/> Back to sign in
            </Link>
          </div>) : (<>
            <h2 className="text-2xl font-semibold mt-6">Forgot password?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we'll send you instructions to reset.
            </p>
            <form className="mt-6 space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                    await forgotPassword(email);
                    setSent(true);
                } catch (err) {
                    toast.error(err.message);
                } finally {
                    setLoading(false);
                }
            }}>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                  <Input id="email" type="email" required className="pl-10 h-11" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
            <Link to="/login" className="inline-flex items-center gap-1 mt-6 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4"/> Back to sign in
            </Link>
          </>)}
      </div>
    </div>);
}
