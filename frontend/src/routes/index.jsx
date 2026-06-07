import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkFlow HR — Attendance and leave in one place" },
      {
        name: "description",
        content: "Track attendance, manage leave requests, and keep your team aligned in one modern HR workspace.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    navigate({ to: user.role === "admin" ? "/admin" : "/dashboard" });
  }, [loading, navigate, user]);

  const highlights = [
    {
      icon: Clock3,
      title: "Live attendance",
      description: "Track check-ins, check-outs, and hours without spreadsheet noise.",
    },
    {
      icon: CalendarDays,
      title: "Leave management",
      description: "Request time off, review balances, and approve leaves quickly.",
    },
    {
      icon: Users,
      title: "Team visibility",
      description: "See who is in, who is out, and what needs attention today.",
    },
  ];

  const stats = [
    { label: "Teams onboarded", value: "120+" },
    { label: "Avg. setup", value: "4 min" },
    { label: "Approvals processed", value: "9k+" },
  ];

  const activity = [
    { name: "Ava Martin", role: "Checked in", time: "08:45 AM", tone: "success" },
    { name: "Noah Patel", role: "Leave approved", time: "10:10 AM", tone: "info" },
    { name: "Maya Chen", role: "Pending review", time: "11:20 AM", tone: "warning" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(69, 98, 255, 0.18), transparent 34%), radial-gradient(circle at 85% 10%, rgba(91, 189, 155, 0.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72))",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[320px] opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(69, 98, 255, 0.14) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card/85 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Briefcase className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  WorkFlow HR
                </div>
                <div className="text-sm text-muted-foreground">
                  Attendance and leave in one place
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="shadow-lg shadow-primary/20">
                <Link to="/signup">
                  Get started
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-10 py-8 lg:py-14 xl:flex-row xl:items-center xl:gap-16">
            <section className="max-w-2xl flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="size-3.5 text-primary" />
                Built for fast-moving teams
              </div>

              <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Attendance, leave, and team visibility without the spreadsheet mess.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                WorkFlow HR gives employees a simple daily check-in flow and gives admins
                the controls they need to approve leave, review presence, and keep the
                team aligned.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-6 text-base font-semibold">
                  <Link to="/signup">
                    Create an account
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base font-semibold">
                  <Link to="/login">Open dashboard</Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card/85 p-4 shadow-sm backdrop-blur">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-1 justify-center xl:justify-end">
              <div className="w-full max-w-[560px] rounded-[32px] border border-border bg-card/90 p-5 shadow-[0_30px_80px_rgba(69,98,255,0.12)] backdrop-blur sm:p-6">
                <div className="rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                        Today at a glance
                      </div>
                      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                        A clean command center for daily operations.
                      </h2>
                    </div>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                      <LayoutDashboard className="size-7" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {activity.map((item) => (
                      <div key={`${item.name}-${item.role}`} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                        <div className="text-sm font-semibold">{item.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">
                          {item.role}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/80">
                          <span
                            className={`size-2 rounded-full ${
                              item.tone === "success"
                                ? "bg-success"
                                : item.tone === "warning"
                                  ? "bg-warning"
                                  : "bg-info"
                            }`}
                          />
                          {item.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ShieldCheck className="size-4 text-primary" />
                      Secure access
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Role-based views for employees and admins keep each person focused on
                      the work they need to do.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="size-4 text-success" />
                      Login, dashboard, and approvals ready to use
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border bg-background p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <ClipboardCheck className="size-4 text-primary" />
                      Fast approvals
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Review leave requests, monitor attendance, and keep records tidy from
                      a single interface.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="size-4 text-success" />
                      Designed for quick daily decisions
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <section className="grid gap-4 pb-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-1"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
