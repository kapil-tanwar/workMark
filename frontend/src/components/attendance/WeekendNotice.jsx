import { CalendarOff } from "lucide-react";
import { isSunday } from "@/lib/utils/date";

export function WeekendNotice() {
  if (!isSunday()) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-info/25 bg-info-soft px-4 py-3.5 text-sm text-info">
      <span className="size-8 rounded-[10px] bg-info/15 grid place-items-center shrink-0"><CalendarOff className="size-4" /></span>
      <div>
        <p className="font-semibold">Today is Sunday — no work</p>
        <p className="opacity-80 mt-0.5">Check-in and check-out are disabled on Sundays.</p>
      </div>
    </div>
  );
}
