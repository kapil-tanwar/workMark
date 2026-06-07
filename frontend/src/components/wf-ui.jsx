import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
const map = {
    Present: "bg-success/15 text-success border-success/20",
    Late: "bg-warning/20 text-warning-foreground border-warning/30",
    Absent: "bg-destructive/10 text-destructive border-destructive/20",
    Leave: "bg-info/15 text-info border-info/20",
    Pending: "bg-warning/20 text-warning-foreground border-warning/30",
    Approved: "bg-success/15 text-success border-success/20",
    Rejected: "bg-destructive/10 text-destructive border-destructive/20",
    Active: "bg-success/15 text-success border-success/20",
    Inactive: "bg-muted text-muted-foreground border-border",
};
export function StatusBadge({ status, className }) {
    return (<Badge variant="outline" className={cn("font-medium", map[status] || "", className)}>
      <span className="size-1.5 rounded-full bg-current mr-1.5 opacity-70"/>
      {status}
    </Badge>);
}
export function PageHeader({ title, description, actions, }) {
    return (<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>);
}
export function StatCard({ label, value, hint, icon: Icon, tone = "default", }) {
    const tones = {
        default: "bg-muted text-foreground",
        primary: "bg-primary-soft text-primary",
        success: "bg-success/15 text-success",
        warning: "bg-warning/20 text-warning-foreground",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-info/15 text-info",
    };
    return (<div className="bg-card border border-border rounded-xl p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        {Icon && (<div className={cn("size-10 rounded-lg flex items-center justify-center", tones[tone])}>
            <Icon className="size-5"/>
          </div>)}
      </div>
    </div>);
}
