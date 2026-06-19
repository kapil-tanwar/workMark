import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight, Clock3, CalendarDays, Users, BarChart2, Shield, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkFlow HR — Modern HR Management" },
      { name: "description", content: "Track attendance, manage leave requests, and keep your team aligned in one modern HR workspace." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  }, [loading, navigate, user]);

  const features = [
    {
      icon: Clock3, title: "Live Attendance",
      desc: "Real-time tracking with check-in flows. Know exactly who is in, remote, or on break at a glance.",
      col: "md:col-span-8", iconBg: "bg-primary-container", iconColor: "text-on-primary-container",
      visual: true,
    },
    {
      icon: CalendarDays, title: "Leave Management",
      desc: "Automated approval workflows and balance tracking. No more email threads or manual calculations.",
      col: "md:col-span-4", iconBg: "bg-tertiary-container", iconColor: "text-on-tertiary-container",
      footer: "Balance: 12.5 Days · Approved",
    },
    {
      icon: Users, title: "Team Visibility",
      desc: "Centralized directory with reporting lines for organizational transparency.",
      col: "md:col-span-4", iconBg: "bg-secondary-container", iconColor: "text-on-secondary-container",
    },
    {
      icon: BarChart2, title: "One-Click Reports",
      desc: "Export payroll-ready data in seconds. Custom filters and scheduled automated reports.",
      col: "md:col-span-8", iconBg: "bg-outline-variant/20", iconColor: "text-primary",
      wideVisual: true,
    },
  ];

  return (
    <div
      className="min-h-screen text-on-surface overflow-x-hidden"
      style={{ backgroundColor: "#121416", color: "#e2e2e5" }}
    >
      {/* ── Navbar ── */}
      <header
        className="fixed top-0 left-0 w-full z-50 h-16 flex items-center px-8 justify-between border-b"
        style={{ backdropFilter: "blur(12px)", background: "rgba(12,14,16,0.8)", borderColor: "rgba(67,70,85,0.3)" }}
      >
        <div className="flex items-center gap-8">
          <span className="font-headline text-xl font-bold" style={{ color: "#dde1ff" }}>WorkFlow HR</span>
          <nav className="hidden md:flex gap-6 text-sm">
            <span className="font-bold cursor-pointer" style={{ color: "#dde1ff" }}>Platform</span>
            <span className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" style={{ color: "#e2e2e5" }}>Solutions</span>
            <span className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" style={{ color: "#e2e2e5" }}>Pricing</span>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-80" style={{ color: "#e2e2e5" }}>
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#dde1ff", color: "#071749" }}
          >
            Open dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden"
        style={{
          background: "radial-gradient(circle at top right, rgba(221,225,255,0.08), transparent 40%), radial-gradient(circle at bottom left, rgba(111,251,190,0.05), transparent 40%)"
        }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-[120px]" style={{ background: "rgba(183,196,255,0.15)" }} />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-[150px]" style={{ background: "rgba(79,222,163,0.08)" }} />
        </div>

        <div className="container mx-auto px-6 sm:px-8 relative z-10 text-center max-w-5xl">
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-8 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(40,42,44,0.8)", borderColor: "rgba(67,70,85,0.5)", color: "#6ffbbe" }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#6ffbbe" }} />
            v2.4 Now Live
          </div>

          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-tight mb-8" style={{ color: "#e2e2e5" }}>
            Attendance, leave, and team visibility{" "}
            <br className="hidden md:block" />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(to right, #dde1ff, #6ffbbe)" }}
            >
              without the spreadsheet mess.
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#c4c5d7" }}>
            The modern operating system for high-growth teams. Streamline operations, automate compliance, and give your employees the clarity they deserve.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto font-bold text-base px-10 py-4 rounded-xl transition-all hover:shadow-[0_0_24px_rgba(221,225,255,0.25)] active:scale-95"
              style={{ background: "#dde1ff", color: "#071749" }}
            >
              Create an account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto font-bold text-base px-10 py-4 rounded-xl border transition-all hover:opacity-80 active:scale-95"
              style={{ background: "rgba(26,28,30,0.8)", borderColor: "rgba(67,70,85,0.5)", color: "#e2e2e5" }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bento Features ── */}
      <section className="px-6 sm:px-8 py-24" style={{ backgroundColor: "#0c0e10" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <h2 className="font-headline text-3xl sm:text-4xl font-bold mb-4" style={{ color: "#e2e2e5" }}>
              Precision-engineered for HR.
            </h2>
            <p className="text-base" style={{ color: "#c4c5d7" }}>
              Every module built with developer-grade logic and executive-level clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Live Attendance — wide */}
            <div
              className="md:col-span-8 rounded-[2rem] p-7 border flex flex-col justify-between group overflow-hidden relative"
              style={{ background: "#1a1c1e", borderColor: "rgba(67,70,85,0.3)" }}
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "#b7c4ff", color: "#071749" }}>
                  <Clock3 className="size-5" />
                </div>
                <h3 className="font-headline text-xl font-bold mb-3" style={{ color: "#e2e2e5" }}>Live Attendance</h3>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: "#c4c5d7" }}>
                  Real-time tracking with check-in flows. Know exactly who is in, remote, or on break at a glance.
                </p>
              </div>
              {/* Mini visual */}
              <div className="mt-10 -mb-7 -mr-7 self-end transition-transform duration-500 group-hover:scale-105">
                <div className="w-60 h-36 rounded-tl-2xl border-t border-l p-4" style={{ background: "#282a2c", borderColor: "rgba(67,70,85,0.5)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full" style={{ background: "#424479" }} />
                    <div className="space-y-1.5">
                      <div className="h-2 w-20 rounded" style={{ background: "#434655" }} />
                      <div className="h-1.5 w-12 rounded opacity-40" style={{ background: "#434655" }} />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-1.5 w-full rounded overflow-hidden" style={{ background: "rgba(67,70,85,0.3)" }}>
                      <div className="h-full w-4/5 rounded" style={{ background: "#b7c4ff" }} />
                    </div>
                    <div className="h-1.5 w-full rounded overflow-hidden" style={{ background: "rgba(67,70,85,0.3)" }}>
                      <div className="h-full w-2/5 rounded" style={{ background: "#6ffbbe" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Management — narrow */}
            <div
              className="md:col-span-4 rounded-[2rem] p-7 border flex flex-col group"
              style={{ background: "#1a1c1e", borderColor: "rgba(67,70,85,0.3)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "#4fdea3", color: "#002114" }}>
                <CalendarDays className="size-5" />
              </div>
              <h3 className="font-headline text-xl font-bold mb-3" style={{ color: "#e2e2e5" }}>Leave Management</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#c4c5d7" }}>
                Automated approval workflows and balance tracking. No more email threads.
              </p>
              <div className="mt-auto pt-8 flex items-center justify-between text-xs font-bold uppercase tracking-wider" style={{ color: "#c4c5d7" }}>
                <span>Balance: 12.5 Days</span>
                <span style={{ color: "#6ffbbe" }}>Approved</span>
              </div>
            </div>

            {/* Team Visibility */}
            <div
              className="md:col-span-4 rounded-[2rem] p-7 border flex flex-col group"
              style={{ background: "#1a1c1e", borderColor: "rgba(67,70,85,0.3)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "#424479", color: "#b2b3f0" }}>
                <Users className="size-5" />
              </div>
              <h3 className="font-headline text-xl font-bold mb-3" style={{ color: "#e2e2e5" }}>Team Visibility</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#c4c5d7" }}>
                Centralized directory with reporting lines and skill mapping for transparency.
              </p>
            </div>

            {/* Reports — wide */}
            <div
              className="md:col-span-8 rounded-[2rem] p-7 border flex items-center justify-between group overflow-hidden"
              style={{ background: "#1a1c1e", borderColor: "rgba(67,70,85,0.3)" }}
            >
              <div className="max-w-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(67,70,85,0.4)", color: "#dde1ff" }}>
                  <BarChart2 className="size-5" />
                </div>
                <h3 className="font-headline text-xl font-bold mb-3" style={{ color: "#e2e2e5" }}>One-Click Reports</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#c4c5d7" }}>
                  Export payroll-ready data in seconds. Custom filters and scheduled automated reports.
                </p>
              </div>
              <div className="hidden md:flex flex-col gap-2 rotate-6 opacity-20 group-hover:opacity-50 transition-opacity">
                <div className="w-32 h-3 rounded-full" style={{ background: "rgba(221,225,255,0.4)" }} />
                <div className="w-48 h-3 rounded-full" style={{ background: "rgba(221,225,255,0.6)" }} />
                <div className="w-40 h-3 rounded-full" style={{ background: "rgba(221,225,255,0.3)" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 sm:px-8 py-32" style={{ backgroundColor: "#121416" }}>
        <div
          className="max-w-4xl mx-auto rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden"
          style={{ background: "#dde1ff" }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cta-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="black" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-grid)" />
            </svg>
          </div>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold mb-6 relative z-10" style={{ color: "#071749" }}>
            Ready to stop managing spreadsheets?
          </h2>
          <p className="text-base mb-12 max-w-xl mx-auto relative z-10" style={{ color: "#374476" }}>
            Join over 2,500 companies using WorkFlow HR to build a more efficient and transparent workplace today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to="/signup"
              className="w-full sm:w-auto font-bold text-base px-12 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "#071749", color: "#dde1ff" }}
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto font-bold text-base px-12 py-4 rounded-2xl border-2 transition-all hover:opacity-70"
              style={{ borderColor: "rgba(7,23,73,0.25)", color: "#071749" }}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 sm:px-8 py-16 border-t" style={{ backgroundColor: "#0c0e10", borderColor: "rgba(67,70,85,0.3)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="sm:col-span-2 md:col-span-1">
            <span className="font-headline text-xl font-bold block mb-4" style={{ color: "#dde1ff" }}>WorkFlow HR</span>
            <p className="text-sm leading-relaxed" style={{ color: "#c4c5d7" }}>Building the future of workforce management with precision and care.</p>
          </div>
          {[
            { title: "Product", links: ["Features", "Integrations", "Enterprise", "Pricing"] },
            { title: "Company", links: ["About Us", "Careers", "Press", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#e2e2e5" }}>{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}><span className="text-sm cursor-pointer hover:opacity-80 transition-opacity" style={{ color: "#c4c5d7" }}>{l}</span></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "#e2e2e5" }}>Newsletter</h4>
            <p className="text-sm mb-4" style={{ color: "#c4c5d7" }}>Stay updated with the latest in HR tech.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 px-4 py-2 text-sm rounded-l-xl border-none outline-none focus:ring-1"
                style={{ background: "#282a2c", color: "#e2e2e5", focusRingColor: "#dde1ff" }}
              />
              <button className="px-4 py-2 rounded-r-xl font-bold text-sm" style={{ background: "#b7c4ff", color: "#071749" }}>→</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs" style={{ borderColor: "rgba(67,70,85,0.2)", color: "#c4c5d7" }}>
          <p>© 2024 WorkFlow HR Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
              <span key={t} className="cursor-pointer hover:opacity-80 transition-opacity">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
