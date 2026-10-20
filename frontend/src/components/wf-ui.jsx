import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

/* ── Status chip: soft tinted pill, theme-aware via tokens ── */
const statusChipMap = {
  Present:  "bg-success-soft text-tertiary",
  Late:     "bg-warning-soft text-warning",
  Absent:   "bg-danger-soft text-destructive",
  Leave:    "bg-pending-soft text-pending",
  Pending:  "bg-warning-soft text-warning",
  Approved: "bg-success-soft text-tertiary",
  Rejected: "bg-danger-soft text-destructive",
  Active:   "bg-success-soft text-tertiary",
  Inactive: "bg-muted text-muted-foreground",
};
const statusDotMap = {
  Present: "bg-tertiary", Late: "bg-warning", Approved: "bg-tertiary", Active: "bg-tertiary",
  Absent: "bg-destructive", Rejected: "bg-destructive",
  Leave: "bg-pending", Pending: "bg-warning", Inactive: "bg-muted-foreground",
};

export function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap",
      statusChipMap[status] ?? "bg-muted text-muted-foreground", className
    )}>
      <span className={cn("size-1.5 rounded-full shrink-0", statusDotMap[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

/* ── Page header ── */
export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7 sm:mb-9">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2.5 flex items-center gap-2"><span className="h-px w-5 bg-brand" />{eyebrow}</p>}
        <h2 className="font-headline text-[1.75rem] sm:text-[2.15rem] font-bold tracking-[-0.04em] text-foreground leading-[1.08]">{title}</h2>
        {description && <p className="text-sm sm:text-[14.5px] text-muted-foreground mt-2 max-w-2xl leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/* ── Panel: the standard content container (header + body) ── */
export function Panel({ title, subtitle, action, children, className, bodyClassName, flush }) {
  return (
    <section className={cn("surface min-w-0 overflow-hidden", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 sm:px-6 h-14 border-b border-hairline">
          <div className="min-w-0 flex items-baseline gap-2">
            <h3 className="font-headline text-[15px] font-semibold tracking-[-0.02em] truncate">{title}</h3>
            {subtitle && <span className="text-xs text-muted-foreground truncate">{subtitle}</span>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-5 sm:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-14 px-6", className)}>
      <div className="relative mb-4">
        <div aria-hidden="true" className="absolute inset-0 -m-3 rounded-full bg-brand/10 blur-xl" />
        <div className="relative size-12 rounded-2xl bg-muted border border-border grid place-items-center text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="font-headline font-semibold text-[15px] tracking-tight">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Stat card ── tone → icon chip colour */
const toneMap = {
  default:     { chip: "bg-muted text-muted-foreground", bar: "bg-muted-foreground/40" },
  primary:     { chip: "bg-primary-fixed text-on-primary-fixed", bar: "bg-brand" },
  success:     { chip: "bg-tertiary-fixed text-tertiary", bar: "bg-success" },
  destructive: { chip: "bg-error-container text-on-error-container", bar: "bg-destructive" },
  info:        { chip: "bg-secondary-fixed text-on-secondary-fixed", bar: "bg-info" },
  warning:     { chip: "bg-warning-soft text-warning", bar: "bg-brand-2" },
};

export function StatCard({ label, value, hint, icon: Icon, tone = "default", onClick, className }) {
  const t = toneMap[tone] ?? toneMap.default;
  const interactive = typeof onClick === "function";
  const Comp = interactive ? "button" : "div";
  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative text-left surface p-5 min-w-0 overflow-hidden transition-all duration-300",
        interactive && "hover:-translate-y-0.5 hover:border-input active:scale-[0.99] w-full",
        className
      )}
    >
      <span aria-hidden="true" className={cn("absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full opacity-70", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow !text-[10px] leading-snug">{label}</p>
        {Icon && (
          <span className={cn("size-8 rounded-[10px] grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-110", t.chip)}>
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="num font-headline text-[2.4rem] font-bold tracking-[-0.05em] text-foreground leading-none mt-4">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-2.5">{hint}</p>}
    </Comp>
  );
}

/* ── Inline skeleton ── */
export function SkeletonBlock({ className }) {
  return <div className={cn("shimmer rounded-lg", className)} aria-hidden="true" />;
}
