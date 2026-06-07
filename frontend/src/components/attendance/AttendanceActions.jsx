import { LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendanceActions } from "@/hooks/use-attendance-actions";

export function AttendanceActions({ todayRec, className = "" }) {
  const { busy, blocked, handleCheckIn, handleCheckOut } = useAttendanceActions();

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${className}`}>
      <Button
        className="flex-1 sm:flex-none"
        disabled={blocked || busy || !!todayRec?.checkIn}
        onClick={handleCheckIn}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Check in
      </Button>
      <Button
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={blocked || busy || !todayRec?.checkIn || !!todayRec?.checkOut}
        onClick={handleCheckOut}
      >
        <LogOut className="size-4" /> Check out
      </Button>
    </div>
  );
}
