import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/wf-ui";

export function PendingLeavesPanel({ pending, getUserName }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm sm:text-base">Pending leave requests</h3>
        <Link to="/admin/leaves" className="text-xs sm:text-sm text-primary font-medium hover:underline shrink-0">
          Review
        </Link>
      </div>
      {pending.length === 0 ? (
        <div className="p-8 sm:p-10 text-center text-sm text-muted-foreground">All caught up</div>
      ) : (
        <div className="divide-y divide-border">
          {pending.slice(0, 5).map((l) => (
            <div key={l.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-sm truncate">{getUserName(l)}</p>
                <StatusBadge status={l.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {l.type} · {l.startDate} → {l.endDate}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
