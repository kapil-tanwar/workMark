import { Link } from "react-router-dom";
import { StatusBadge, EmptyState } from "@/components/wf-ui";
import { CheckCheck, ArrowUpRight } from "lucide-react";

export function PendingLeavesPanel({ pending, getUserName }) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-5 sm:px-6 h-14 flex items-center justify-between border-b border-hairline shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-headline text-[15px] font-semibold tracking-[-0.02em]">Pending requests</h3>
          {pending.length > 0 && (
            <span className="num h-5 min-w-5 px-1.5 grid place-items-center rounded-full bg-warning-soft text-warning text-[11px] font-semibold">{pending.length}</span>
          )}
        </div>
        <Link to="/admin/leaves" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:gap-1.5 transition-all">
          Review <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          className="flex-1"
          icon={CheckCheck}
          title="All caught up"
          description="You've responded to all recent leave and adjustment requests."
        />
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-hairline">
          {pending.slice(0, 8).map((item) => (
            <div key={item.id} className="px-5 sm:px-6 py-3.5 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[13.5px] text-foreground truncate">{getUserName(item)}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.kind === "compoff" ? (
                <p className="text-[11.5px] text-muted-foreground mt-1 font-mono">
                  Comp-off · {item.duration === "half" ? "Half day" : "Full day"} · {item.overtimeDate}
                </p>
              ) : (
                <p className="text-[11.5px] text-muted-foreground mt-1">
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
