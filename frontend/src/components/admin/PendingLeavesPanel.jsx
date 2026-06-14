import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/wf-ui";

export function PendingLeavesPanel({ pending, getUserName }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm sm:text-base">Pending requests</h3>
        <Link to="/admin/leaves" className="text-xs sm:text-sm text-primary font-medium hover:underline shrink-0">
          Review
        </Link>
      </div>
      {pending.length === 0 ? (
        <div className="p-8 sm:p-10 text-center text-sm text-muted-foreground">All caught up</div>
      ) : (
        <div className="divide-y divide-border">
          {pending.slice(0, 8).map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm truncate">{getUserName(item)}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.kind === "compoff" ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Comp-off credit · {item.duration === "half" ? "Half day" : "Full day"} · {item.overtimeDate}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.type} · {item.duration === "half" ? "Half day" : "Full day"}
                  {item.startDate === item.endDate ? ` · ${item.startDate}` : ` · ${item.startDate} → ${item.endDate}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
