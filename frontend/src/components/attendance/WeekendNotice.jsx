import { CalendarOff } from "lucide-react";
import { isSunday } from "@/lib/utils/date";

export function WeekendNotice() {
  if (!isSunday()) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
      <CalendarOff className="size-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Today is Sunday — no work</p>
        <p className="text-info/80 mt-0.5">Check-in and check-out are disabled on Sundays.</p>
      </div>
    </div>
  );
}
