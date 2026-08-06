import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  ArrowRight, Timer, CalendarRange, UsersRound, PlayCircle, Check, Globe, Share2, Briefcase, User, CheckCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";



/* ── Scroll animation wrapper ── */
function FadeIn({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.05 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate(user.role === "admin" ? "/admin" : "/dashboard");
  }, [loading, navigate, user]);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden bg-background">
      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 w-full z-50 h-16 flex items-center px-6 md:px-12 justify-between border-b border-border/30 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-8 max-w-7xl mx-auto w-full justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="size-8 rounded-lg flex items-center justify-center font-headline font-black text-sm bg-primary text-primary-foreground">
              <Briefcase className="size-4.5" />
            </div>
            <span className="font-headline text-lg font-bold text-primary">WorkFlow HR</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <ThemeToggle />
            <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold cursor-pointer">
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Get Started
            </Link>
          </div>
          {/* Mobile Theme Toggle & Guest User Icon Link */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="size-10 rounded-full border border-border bg-card text-foreground hover:bg-muted flex items-center justify-center transition-all active:scale-95 shadow-sm"
              title="Guest Sign In"
            >
              <User className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 md:pt-32">
        {/* ── Hero Section ── */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto relative text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)]" />
          <div className="relative z-10 max-w-4xl mx-auto">
            {/* Live badge */}
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/40 border-border mb-8 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                <span>V4.0 Engineering Edition Now Live</span>
              </div>
            </FadeIn>

            <FadeIn delay={150}>
              <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight mb-6 text-foreground">
                Attendance, leave, and team visibility without the{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-fixed to-secondary-fixed">spreadsheet mess.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={250}>
              <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed text-muted-foreground">
                Built for high-growth tech teams. Scientifically track every movement, automated leave approvals, and live dashboards that executives actually understand.
              </p>
            </FadeIn>

            <FadeIn delay={350}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto font-bold text-base px-8 py-4 rounded-full transition-all hover:shadow-[0_0_20px_rgba(221,225,255,0.3)] active:scale-95 bg-primary text-primary-foreground text-center"
                >
                  Get Started Free
                </Link>
                <button
                  className="w-full sm:w-auto font-semibold text-base px-8 py-4 rounded-full border border-border transition-all hover:bg-muted active:scale-95 bg-card text-foreground flex items-center justify-center gap-2"
                >
                  <PlayCircle className="size-5 text-muted-foreground" />
                  Watch Demo
                </button>
              </div>
            </FadeIn>
          </div>

          {/* Dashboard Mockup */}
          <FadeIn delay={450}>
            <div className="relative w-full max-w-5xl mx-auto">
              <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-border/30 bg-card/40 backdrop-blur-md p-2 sm:p-4 shadow-2xl overflow-hidden">
                <div className="w-full aspect-[16/10] rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden bg-muted relative border border-border/50">
                  <img
                    src="/dashboard-mockup.png"
                    alt="WorkFlow HR Dashboard Mockup"
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Colorful Bubbles Overlay */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    <div className="absolute top-[15%] left-[20%] w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-primary/30 blur-[20px] sm:blur-[40px] animate-bubble-1" />
                    <div className="absolute bottom-[20%] right-[15%] w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-secondary/35 blur-[25px] sm:blur-[50px] animate-bubble-2" />
                    <div className="absolute top-[45%] right-[25%] w-20 h-20 sm:w-36 sm:h-36 rounded-full bg-tertiary/30 blur-[20px] sm:blur-[40px] animate-bubble-3" />
                    <div className="absolute bottom-[10%] left-[30%] w-28 h-28 sm:w-44 sm:h-44 rounded-full bg-accent/25 blur-[25px] sm:blur-[45px] animate-bubble-4" />
                  </div>
                </div>
              </div>
              {/* Decorative glows */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
            </div>
          </FadeIn>
        </section>

        {/* ── Features Bento Grid ── */}
        <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <FadeIn>
              <div className="bg-card/40 backdrop-blur-md p-8 rounded-[2rem] border border-border/30 hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Timer className="size-6" />
                </div>
                <h3 className="font-headline text-xl font-bold text-foreground mb-4">Live Attendance</h3>
                <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                  Automated check-ins with geo-fencing and device recognition. Real-time presence status for distributed teams.
                </p>
                <div className="mt-auto pt-4 border-t border-border/30">
                  <span className="text-primary font-mono text-xs font-bold uppercase tracking-wider">99.9% ACCURACY</span>
                </div>
              </div>
            </FadeIn>
            {/* Feature 2 */}
            <FadeIn delay={150}>
              <div className="bg-card/40 backdrop-blur-md p-8 rounded-[2rem] border border-border/30 hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <CalendarRange className="size-6" />
                </div>
                <h3 className="font-headline text-xl font-bold text-foreground mb-4">Leave Management</h3>
                <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                  One-click requests and automated policy enforcement. Syncs instantly with team calendars and payroll.
                </p>
                <div className="mt-auto pt-4 border-t border-border/30">
                  <span className="text-primary font-mono text-xs font-bold uppercase tracking-wider">AUTO-SYNC ENABLED</span>
                </div>
              </div>
            </FadeIn>
            {/* Feature 3 */}
            <FadeIn delay={300}>
              <div className="bg-card/40 backdrop-blur-md p-8 rounded-[2rem] border border-border/30 hover:border-primary/50 transition-all duration-300 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <UsersRound className="size-6" />
                </div>
                <h3 className="font-headline text-xl font-bold text-foreground mb-4">Team Visibility</h3>
                <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                  Who’s working, who’s OOO, and who’s on break. Visual bird's-eye view of your entire organization.
                </p>
                <div className="mt-auto pt-4 border-t border-border/30">
                  <span className="text-primary font-mono text-xs font-bold uppercase tracking-wider">LIVE COMMAND MAP</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ── Command Center ── */}
        <section className="py-24 bg-muted/10 overflow-hidden border-t border-border/20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold mb-4 block">Operational Core</span>
                <FadeIn>
                  <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-8">
                    A clean command center for daily operations.
                  </h2>
                </FadeIn>
                <FadeIn delay={150}>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-12">
                    Forget tab-switching. We consolidated your most critical HR tasks into a single, high-performance dashboard that gives you total organizational control in seconds.
                  </p>
                </FadeIn>
                <ul className="space-y-6">
                  <FadeIn delay={250}>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="size-5 text-primary mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">Intelligent Routing</h4>
                        <p className="text-muted-foreground text-sm mt-0.5">Automatically routes requests to the right manager based on org chart data.</p>
                      </div>
                    </li>
                  </FadeIn>
                  <FadeIn delay={350}>
                    <li className="flex items-start gap-4">
                      <CheckCircle className="size-5 text-primary mt-1 shrink-0" />
                      <div>
                        <h4 className="font-bold text-foreground text-sm sm:text-base">Dynamic Thresholds</h4>
                        <p className="text-muted-foreground text-sm mt-0.5">Custom alerts for under-staffing or attendance anomalies.</p>
                      </div>
                    </li>
                  </FadeIn>
                </ul>
              </div>

              {/* Preview Cards Grid — Stacks vertically on mobile (grid-cols-1), side-by-side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative w-full">
                {/* Checked-in Card */}
                <FadeIn>
                  <div className="bg-card/40 backdrop-blur-md rounded-[2rem] p-6 border border-border/30 shadow-xl space-y-6 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Status</span>
                      <span className="size-2.5 rounded-full bg-success animate-pulse shrink-0" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-cover bg-center border border-border" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBTTfAyKnn7qHD_L1BgptVekszFri3asuq3kcC3LbORKNfH2ODTai0OMFaJ2cFNog5P8veMI0BFmjm18YW7uPxhsKnMaVia_mVf6OLGgqne-S2loqw2_tsaeUOqSSD20mtwjHS0ecANxMQBElE0M5w9PYisaa4iia6ThuYS-P0BLco04jA41tUzjj1lm0DMBjTGuDXRN2gEEuGNLETAoF7QNwGtYAq2nnfnmsvhYIgovs0l8RN9568WTdBQBFU9xa-sM28WLxRMBgkM')" }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">Sarah Chen</p>
                          <p className="text-xs text-muted-foreground truncate">Checked in 08:45 AM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl opacity-60">
                        <div className="w-10 h-10 rounded-full bg-cover bg-center border border-border" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4zWG16Up0awYjkYzI5lplTtkKy-J0gx4r2ygJkL5z2c0Fgu7KSKgHBUR0ydzT9LDVTyfOEc62DMEGKepEGMPdunBxrPwDgjzIRCMXjJwT5gH7DrjYb0uiKonzviByaauWmSe9IkDjrJ7VbMT0eAHF1XOXqFeg-5Q3Nwtw5m-IuT5_68cIRuUOcCF49Ktik60Lu4k-GkTRTn0nWskwP66Sqs9v_sNGfTrCvc4pCkunqFDhjFlEyWrwVRFvh5s3Pxlkp5YxTpyCEg-1')" }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">Marcus Wright</p>
                          <p className="text-xs text-muted-foreground truncate">Working Remote</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>

                {/* Pending Reviews Card */}
                <FadeIn delay={200}>
                  <div className="sm:mt-12 bg-card/40 backdrop-blur-md rounded-[2rem] p-6 border border-border/30 shadow-xl space-y-6 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending Reviews</span>
                      <span className="bg-destructive/20 text-destructive px-2 py-0.5 rounded text-[10px] font-bold">3 URGENT</span>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border-l-4 border-destructive">
                      <div className="flex justify-between mb-2">
                        <p className="text-xs font-bold text-foreground">Sick Leave</p>
                        <p className="text-[10px] font-mono text-muted-foreground">TODAY</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">David G. is requesting medical leave due to flu symptoms.</p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 cursor-pointer">Approve</button>
                        <button className="flex-1 py-1.5 border border-border text-foreground rounded-lg text-xs hover:bg-muted/30 cursor-pointer">Deny</button>
                      </div>
                    </div>
                  </div>
                </FadeIn>
                {/* Decorative element */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative overflow-hidden">
          <FadeIn>
            <div className="max-w-5xl mx-auto bg-primary rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--color-primary-foreground)_0%,transparent_70%)]" />
              <div className="relative z-10 space-y-6">
                <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">Ready to simplify your workforce?</h2>
                <p className="text-primary-foreground/80 text-sm max-w-2xl mx-auto leading-relaxed">
                  Join 500+ tech-forward companies who have ditched the manual tracking for good.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto bg-primary-foreground text-primary px-10 py-4 rounded-full text-base font-extrabold hover:scale-105 active:scale-95 transition-all shadow-xl text-center"
                  >
                    Get Started Free
                  </Link>
                  <button
                    className="w-full sm:w-auto bg-transparent border border-primary-foreground/30 text-primary-foreground px-10 py-5 rounded-full text-base font-bold hover:bg-primary-foreground/10 transition-all"
                  >
                    Book a Workshop
                  </button>
                </div>
                <p className="pt-4 text-xs italic opacity-60 font-medium">No credit card required • 14-day free trial • Instant setup</p>
              </div>
            </div>
          </FadeIn>
          {/* Atmospheric bg element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[150px] rounded-full -z-10 pointer-events-none" />
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-card w-full pt-16 pb-8 border-t border-border/40">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-12 max-w-7xl mx-auto mb-16">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <span className="font-headline text-lg font-bold block text-primary">WorkFlow HR</span>
            <p className="text-muted-foreground text-sm leading-relaxed">
              High-performance HR infrastructure for the next generation of builders.
            </p>
          </div>
          {/* <div>
            <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Product</h5>
            <ul className="space-y-3 text-sm">
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#features">Features</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#pricing">Pricing</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Integrations</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Enterprise</a></li>
            </ul>
          </div> */}
          <div>
            <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h5>
            <ul className="space-y-3 text-sm">
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">About</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Careers</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">News</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h5>
            <ul className="space-y-3 text-sm">
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Privacy</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Terms</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">Security</a></li>
              <li><a className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" href="#">GDPR</a></li>
            </ul>
          </div>
        </div>
        <div className="px-6 md:px-12 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between border-t border-border/10 pt-8 gap-4">
          <p className="text-muted-foreground text-xs">© 2024 WorkFlow HR. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a className="hover:text-primary cursor-pointer transition-colors" href="#">Status</a>
            <a className="hover:text-primary cursor-pointer transition-colors" href="#">Docs</a>
            <a className="hover:text-primary cursor-pointer transition-colors" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
