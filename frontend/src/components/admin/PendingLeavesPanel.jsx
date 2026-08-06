import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/wf-ui";
import { FileCheck2 } from "lucide-react";

export function PendingLeavesPanel({ pending, getUserName }) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-border/40 shrink-0">
        <h3 className="font-headline text-lg font-bold text-foreground">Pending requests</h3>
        <Link
          to="/admin/leaves"
          className="text-primary font-bold text-sm hover:underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          Review
        </Link>
      </div>

      {/* Body */}
      {pending.length === 0 ? (
        /* ── Empty state matching reference ── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
          {/* Large circular icon with green check badge */}
          <div className="relative mb-6">
            <div className="size-24 bg-muted rounded-full flex items-center justify-center opacity-40">
              <FileCheck2 className="size-12 text-muted-foreground" strokeWidth={1.2} />
            </div>
            {/* Green check badge */}
            <div className={[
              "absolute -bottom-2 -right-2",
              "size-8 rounded-full flex items-center justify-center",
              "bg-tertiary-fixed text-tertiary",
              "border-4 border-card",
            ].join(" ")}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <p className="font-semibold text-base text-foreground">All caught up</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
            You've responded to all recent leave and adjustment requests.
          </p>
        </div>
      ) : (
        /* ── Pending list ── */
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {pending.slice(0, 8).map((item) => (
            <div key={item.id} className="px-5 py-3.5 hover:bg-muted/25 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-sm text-foreground truncate">{getUserName(item)}</p>
                <StatusBadge status={item.status} />
              </div>
              {item.kind === "compoff" ? (
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Comp-off · {item.duration === "half" ? "Half day" : "Full day"} · {item.overtimeDate}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {item.type} · {item.duration === "half" ? "Half day" : "Full day"}
                  {item.startDate === item.endDate
                    ? ` · ${item.startDate}`
                    : ` · ${item.startDate} → ${item.endDate}`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
