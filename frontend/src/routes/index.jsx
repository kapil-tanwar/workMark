import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  ArrowRight, Timer, CalendarRange, UsersRound, Check, ShieldCheck, Sparkles,
  Fingerprint, BellRing, BarChart3, MapPin, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLockup } from "@/components/BrandMark";
import { Scene3D } from "@/components/three/Scene3D";

/* ── Scroll reveal ── */
function FadeIn({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.unobserve(entry.target); }
    }, { threshold: 0.06 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* Cursor spotlight for cards */
function spot(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const people = [
  { n: "Sarah Chen", s: "Checked in 08:45", tone: "bg-success-soft text-tertiary", l: "Present" },
  { n: "Marcus Wright", s: "Working remote", tone: "bg-pending-soft text-pending", l: "Remote" },
  { n: "Priya Nair", s: "Checked in 09:12", tone: "bg-warning-soft text-warning", l: "Late" },
  { n: "David Gomez", s: "Sick leave", tone: "bg-danger-soft text-destructive", l: "Out" },
];

/* Product preview built from tokens so it is native to both themes */
function ProductPreview() {
  const bars = [62, 80, 54, 91, 76, 38, 84, 70, 95, 66, 58, 88];
  return (
    <div className="relative mx-auto w-full max-w-5xl text-left">
      <div aria-hidden="true" className="absolute -inset-x-10 -top-10 h-64 rounded-full bg-brand/20 blur-[100px]" />
      <div className="relative rounded-[1.75rem] glass-card p-2 sm:p-2.5">
        <div className="rounded-[1.3rem] bg-background border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-10 border-b border-border">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="ml-3 eyebrow !text-[10px]">workmark.app / dashboard</span>
          </div>
          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.45fr_1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[["Present", "142", "text-tertiary"], ["On leave", "9", "text-pending"], ["Absent", "4", "text-destructive"]].map(([l, v, c]) => (
                  <div key={l} className="surface !rounded-xl p-3 sm:p-4">
                    <p className="eyebrow !text-[9.5px]">{l}</p>
                    <p className={`num font-headline text-2xl sm:text-3xl font-bold tracking-[-0.04em] mt-2 ${c}`}>{v}</p>
                  </div>
                ))}
              </div>
              <div className="surface !rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold tracking-tight">Weekly attendance</p>
                  <span className="eyebrow !text-[10px]">Last 12 days</span>
                </div>
                <div className="flex items-end gap-1.5 sm:gap-2 h-28 sm:h-36">
                  {bars.map((h, i) => (
                    <div key={i} className="flex-1 rounded-md bg-brand/15 relative overflow-hidden" style={{ height: `${h}%` }}>
                      <div className="absolute inset-x-0 bottom-0 bg-brand rounded-md" style={{ height: `${Math.min(100, h + 8)}%`, opacity: 0.35 + (i % 4) * 0.18 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="surface !rounded-xl p-4 hidden md:block">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold tracking-tight">Today</p>
                <span className="flex items-center gap-1.5 eyebrow !text-[10px]"><span className="live-dot size-1.5 rounded-full bg-success" />Live</span>
              </div>
              <ul className="space-y-3">
                {people.map((p) => (
                  <li key={p.n} className="flex items-center gap-3">
                    <span className="size-8 shrink-0 rounded-full bg-secondary-fixed text-on-secondary-fixed grid place-items-center text-[11px] font-semibold">
                      {p.n.split(" ").map((x) => x[0]).join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{p.n}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{p.s}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.tone}`}>{p.l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  { icon: Timer, title: "Live attendance", text: "One-tap check-in and check-out with automatic status. Late, present and absent resolve themselves.", tag: "Real-time", span: "md:col-span-2" },
  { icon: CalendarRange, title: "Leave workflows", text: "Requests, approvals and balances in one flow — earned leave and comp-off included.", tag: "Policy-aware", span: "" },
  { icon: UsersRound, title: "Team visibility", text: "Who’s in, who’s out, who’s on leave — a bird’s-eye view of the whole organisation.", tag: "Live roster", span: "" },
  { icon: BarChart3, title: "Reports that read themselves", text: "Export attendance and leave summaries for any range, ready for payroll.", tag: "Exportable", span: "md:col-span-2" },
];

const steps = [
  { icon: Fingerprint, t: "Check in", d: "Employees mark attendance in a tap. WorkMark handles the rest." },
  { icon: BellRing, t: "Request & approve", d: "Leave requests route to admins with instant notifications." },
  { icon: BarChart3, t: "Report", d: "Dashboards and exports update the moment anything changes." },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate(user.role === "admin" ? "/admin" : "/dashboard");
  }, [loading, navigate, user]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden bg-background">
      {/* ── Floating navbar ── */}
      <header className="fixed top-3 sm:top-4 inset-x-0 z-50 px-3 sm:px-6">
        <div className={`mx-auto max-w-5xl h-14 rounded-full px-3 pl-5 flex items-center justify-between transition-all duration-300 ${scrolled ? "glass-card" : "border border-transparent"}`}>
          <Link to="/" aria-label="WorkMark home"><BrandLockup /></Link>
          <nav className="hidden md:flex items-center gap-1 text-[13.5px] font-medium text-muted-foreground" aria-label="Sections">
            {[["Features", "#features"], ["How it works", "#how"], ["Command centre", "#command"]].map(([l, h]) => (
              <a key={h} href={h} className="px-3.5 h-9 grid place-items-center rounded-full hover:text-foreground hover:bg-muted transition-colors">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="btn-glow inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-[13.5px] font-semibold active:scale-95">
              Sign in <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[100svh] flex items-center overflow-hidden">
          <div aria-hidden="true" className="ambient absolute inset-0" />
          <div aria-hidden="true" className="grid-dots absolute inset-x-0 top-0 h-full opacity-50" />
          <Scene3D variant="hero" className="lg:left-[36%] opacity-95" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-12 pt-28 pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
            <div className="max-w-2xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 h-8 pl-2 pr-3.5 rounded-full border border-border bg-card/70 backdrop-blur mb-7">
                  <span className="grid place-items-center h-5 px-2 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold tracking-wide">NEW</span>
                  <span className="text-[12.5px] text-muted-foreground">AI HR assistant now built in</span>
                  <ChevronRight className="size-3.5 text-muted-foreground" />
                </div>
              </FadeIn>
              <FadeIn delay={100}>
                <h1 className="font-headline text-[2.8rem] sm:text-6xl lg:text-[4.6rem] font-bold tracking-[-0.055em] leading-[0.98] mb-6">
                  Every workday,{" "}
                  <span className="text-gradient">beautifully</span>{" "}
                  accounted for.
                </h1>
              </FadeIn>
              <FadeIn delay={200}>
                <p className="text-base sm:text-lg max-w-xl mb-9 leading-relaxed text-muted-foreground">
                  WorkMark brings attendance, leave and team visibility into one calm, precise workspace —
                  so people teams spend less time chasing spreadsheets and more time with people.
                </p>
              </FadeIn>
              <FadeIn delay={300}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-7">
                  <Link to="/login" className="btn-glow font-semibold text-[15px] px-7 h-12 rounded-full active:scale-95 inline-flex items-center justify-center gap-2">
                    Sign in to dashboard <ArrowRight className="size-4" />
                  </Link>
                  <a href="#features" className="font-medium text-[15px] px-7 h-12 rounded-full border border-border bg-card/70 backdrop-blur hover:bg-muted hover:border-input transition-all active:scale-95 inline-flex items-center justify-center">
                    Explore features
                  </a>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-brand" /> Secure portal · Role-based access · Instant setup
                </p>
              </FadeIn>
            </div>

            {/* Floating glass cards over the 3D scene */}
            <div className="relative hidden lg:block h-[420px]" aria-hidden="true">
              <div className="absolute right-2 top-2 w-64 glass-card rounded-2xl p-4 animate-float">
                <div className="flex items-center justify-between mb-3">
                  <span className="eyebrow !text-[10px]">Checked in</span>
                  <span className="live-dot size-1.5 rounded-full bg-success" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-full bg-primary-fixed text-on-primary-fixed grid place-items-center text-xs font-semibold">SC</span>
                  <div><p className="text-sm font-semibold">Sarah Chen</p><p className="text-xs text-muted-foreground">08:45 · On time</p></div>
                </div>
              </div>
              <div className="absolute left-0 bottom-6 w-60 glass-card rounded-2xl p-4 animate-float [animation-delay:-3s]">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground"><MapPin className="size-3.5" /> This month</div>
                <p className="num font-headline text-3xl font-bold tracking-[-0.04em]">96.4<span className="text-lg text-muted-foreground">%</span></p>
                <p className="text-xs text-muted-foreground mt-1">Team attendance rate</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Product preview ── */}
        <section className="relative px-5 md:px-12 max-w-7xl mx-auto pb-10 -mt-6">
          <FadeIn><ProductPreview /></FadeIn>
        </section>

        {/* ── Features (bento) ── */}
        <section id="features" className="py-28 px-5 md:px-12 max-w-7xl mx-auto">
          <FadeIn>
            <div className="max-w-2xl mb-14">
              <p className="eyebrow mb-4 flex items-center gap-2"><span className="h-px w-6 bg-brand" />The platform</p>
              <h2 className="font-headline text-4xl sm:text-5xl font-bold tracking-[-0.05em] leading-[1.02]">
                Everything your people team needs, <span className="accent-italic">nothing it doesn’t.</span>
              </h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {features.map(({ icon: Icon, title, text, tag, span }, i) => (
              <FadeIn key={title} delay={i * 90} className={`${span} h-full`}>
                <div onPointerMove={spot} className="spotlight group h-full surface !rounded-3xl p-7 sm:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:border-input">
                  <div className="size-11 rounded-2xl bg-primary-fixed text-on-primary-fixed grid place-items-center mb-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-headline text-xl font-semibold tracking-[-0.03em] mb-2.5">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow max-w-md">{text}</p>
                  <span className="eyebrow !text-brand mt-8">{tag}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-24 border-y border-border bg-canvas">
          <div className="max-w-7xl mx-auto px-5 md:px-12">
            <FadeIn>
              <p className="eyebrow mb-4 flex items-center gap-2"><span className="h-px w-6 bg-brand" />How it works</p>
              <h2 className="font-headline text-3xl sm:text-4xl font-bold tracking-[-0.045em] leading-[1.05] max-w-xl mb-14">From first check-in to final report, in three steps.</h2>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-5 relative">
              {steps.map(({ icon: Icon, t, d }, i) => (
                <FadeIn key={t} delay={i * 120}>
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="size-12 rounded-2xl surface grid place-items-center text-brand"><Icon className="size-5" /></span>
                      <span className="num font-mono text-xs text-muted-foreground">0{i + 1}</span>
                      {i < steps.length - 1 && <span className="hidden md:block flex-1 h-px bg-gradient-to-r from-border to-transparent" />}
                    </div>
                    <h3 className="font-headline text-lg font-semibold tracking-[-0.02em] mb-2">{t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{d}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Command centre ── */}
        <section id="command" className="py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="eyebrow mb-4 flex items-center gap-2"><span className="h-px w-6 bg-brand" />Operational core</p>
                <FadeIn>
                  <h2 className="font-headline text-4xl sm:text-5xl font-bold tracking-[-0.05em] leading-[1.02] mb-7">
                    A clean command centre for <span className="accent-italic">daily operations.</span>
                  </h2>
                </FadeIn>
                <FadeIn delay={120}>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-10 max-w-lg">
                    Forget tab-switching. Your most critical HR tasks live in a single, high-performance dashboard.
                  </p>
                </FadeIn>
                <ul className="space-y-6">
                  {[
                    ["Intelligent routing", "Leave and comp-off requests land in the right queue, instantly."],
                    ["Dynamic thresholds", "Spot attendance anomalies before they become problems."],
                  ].map(([t, d], i) => (
                    <FadeIn key={t} delay={200 + i * 100}>
                      <li className="flex items-start gap-4">
                        <span className="mt-0.5 size-6 shrink-0 rounded-full bg-primary-fixed text-on-primary-fixed grid place-items-center"><Check className="size-3.5" /></span>
                        <div>
                          <h4 className="font-semibold text-[15px] tracking-tight">{t}</h4>
                          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{d}</p>
                        </div>
                      </li>
                    </FadeIn>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative w-full">
                <FadeIn>
                  <div className="surface !rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="eyebrow">Active status</span>
                      <span className="live-dot size-2 rounded-full bg-success shrink-0" />
                    </div>
                    <div className="space-y-3">
                      {[["Sarah Chen", "Checked in 08:45 AM", "SC", false], ["Marcus Wright", "Working remote", "MW", true]].map(([n, s, i, dim]) => (
                        <div key={n} className={`flex items-center gap-3 p-3 bg-muted rounded-xl ${dim ? "opacity-70" : ""}`}>
                          <span className="size-10 rounded-full bg-secondary-fixed text-on-secondary-fixed grid place-items-center text-xs font-semibold">{i}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{n}</p>
                            <p className="text-xs text-muted-foreground truncate">{s}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
                <FadeIn delay={160}>
                  <div className="sm:mt-10 surface !rounded-3xl p-6">
                    <div className="flex justify-between items-center mb-6">
                      <span className="eyebrow">Pending reviews</span>
                      <span className="bg-warning-soft text-warning px-2 py-0.5 rounded-full text-[10px] font-semibold">3 urgent</span>
                    </div>
                    <div className="p-4 bg-muted rounded-xl border-l-2 border-brand-2">
                      <div className="flex justify-between mb-2">
                        <p className="text-xs font-semibold">Sick leave</p>
                        <p className="eyebrow !text-[10px]">Today</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">David G. is requesting medical leave due to flu symptoms.</p>
                      <div className="flex gap-2">
                        <span className="btn-glow flex-1 py-2 text-center rounded-lg text-xs font-semibold">Approve</span>
                        <span className="flex-1 py-2 text-center border border-border rounded-lg text-xs font-medium">Deny</span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="pb-28 px-5 md:px-12 max-w-7xl mx-auto">
          <FadeIn>
            <div className="relative overflow-hidden max-w-5xl mx-auto rounded-[2rem] sm:rounded-[2.5rem] px-6 py-16 sm:p-20 text-center text-white bg-[#050807] grain">
              <div aria-hidden="true" className="absolute -top-32 left-1/2 -translate-x-1/2 size-[36rem] rounded-full bg-[#0c8f6b]/45 blur-[120px]" />
              <div aria-hidden="true" className="absolute -bottom-40 -right-20 size-[24rem] rounded-full bg-[#e9a23b]/20 blur-[120px]" />
              <Scene3D variant="wave" stage className="opacity-70" />
              <div className="relative z-10 space-y-6">
                <Sparkles className="size-6 mx-auto text-[#4fe0b0]" />
                <h2 className="font-headline text-4xl sm:text-5xl font-bold tracking-[-0.05em] leading-[1.02]">
                  Ready to simplify <span className="font-display italic font-normal text-[#8ef0cc]">your workforce?</span>
                </h2>
                <p className="text-white/65 text-base max-w-xl mx-auto leading-relaxed">
                  Sign in and see every check-in, leave request and report in one place.
                </p>
                <div className="flex justify-center pt-2">
                  <Link to="/login" className="bg-white text-[#050807] px-9 h-12 rounded-full text-[15px] font-semibold hover:scale-[1.03] active:scale-95 transition-all inline-flex items-center gap-2">
                    Sign in now <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full pt-14 pb-8 border-t border-border">
        <div className="px-5 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-12">
          <div className="space-y-4 max-w-xs">
            <BrandLockup />
            <p className="text-muted-foreground text-sm leading-relaxed">Attendance, leave and team visibility — beautifully accounted for.</p>
          </div>
          <div className="grid grid-cols-2 gap-14">
            {[["Product", [["Features", "#features"], ["How it works", "#how"], ["Command centre", "#command"]]], ["Access", [["Employee sign in", "/login"], ["Admin sign in", "/admin/login"]]]].map(([h, links]) => (
              <div key={h}>
                <h5 className="eyebrow mb-4">{h}</h5>
                <ul className="space-y-2.5 text-sm">
                  {links.map(([l, to]) => (
                    <li key={l}>
                      {to.startsWith("#")
                        ? <a className="text-muted-foreground hover:text-foreground transition-colors" href={to}>{l}</a>
                        : <Link className="text-muted-foreground hover:text-foreground transition-colors" to={to}>{l}</Link>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 md:px-12 max-w-7xl mx-auto border-t border-border pt-6">
          <p className="text-muted-foreground text-xs">© {new Date().getFullYear()} WorkMark. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
