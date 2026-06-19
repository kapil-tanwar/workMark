import { cn } from "@/lib/utils";

/* ── Status chip — MD3 reference design ── */
const statusChipMap = {
  Present:  "bg-[rgba(78,222,163,0.15)] text-tertiary",
  Late:     "bg-[rgba(78,222,163,0.12)] text-tertiary",
  Absent:   "bg-[rgba(186,26,26,0.10)] text-destructive",
  Leave:    "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
  Pending:  "bg-[rgba(70,72,212,0.10)] text-[#4648d4]",
  Approved: "bg-[rgba(78,222,163,0.15)] text-tertiary",
  Rejected: "bg-[rgba(186,26,26,0.12)] text-destructive",
  Active:   "bg-[rgba(78,222,163,0.15)] text-tertiary",
  Inactive: "bg-muted text-muted-foreground",
};

const statusDotMap = {
  Present: "bg-tertiary", Late: "bg-tertiary", Approved: "bg-tertiary", Active: "bg-tertiary",
  Absent: "bg-destructive", Rejected: "bg-destructive",
  Leave: "bg-[#4648d4]", Pending: "bg-[#4648d4]",
  Inactive: "bg-muted-foreground",
};

export function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
      statusChipMap[status] ?? "bg-muted text-muted-foreground",
      className
    )}>
      <span className={cn("size-1.5 rounded-full shrink-0", statusDotMap[status] ?? "bg-muted-foreground")} />
      {status}
    </span>
  );
}

/* ── Page header ── */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
      <div className="min-w-0">
        <h2 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

/**
 * StatCard — MD3 bento tile with icon, large number, label.
 * tone → icon tile color:
 *   primary     → primary-fixed (light blue)
 *   success     → tertiary-fixed (light green)
 *   destructive → error-container (light red)
 *   info        → secondary-fixed (light purple)
 *   warning     → muted/amber
 */
export function StatCard({ label, value, hint, icon: Icon, tone = "default", onClick, className }) {
  const iconTile = {
    default:     "bg-muted text-muted-foreground",
    primary:     "bg-primary-fixed text-on-primary-fixed",
    success:     "bg-tertiary-fixed text-tertiary",
    destructive: "bg-error-container text-on-error-container",
    info:        "bg-secondary-fixed text-on-secondary-fixed",
    warning:     "bg-[rgba(251,191,36,0.18)] text-amber-700 dark:text-amber-400",
  };

  return (
    <div
      className={cn(
        "bg-card border border-border/40 rounded-2xl p-5 min-w-0 card-shadow transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start gap-3">
        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 leading-none">
            {label}
          </p>
          <p className="font-headline text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          {hint && <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>}
        </div>

        {/* Icon tile */}
        {Icon && (
          <div className={cn("p-3 rounded-xl shrink-0", iconTile[tone])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}
