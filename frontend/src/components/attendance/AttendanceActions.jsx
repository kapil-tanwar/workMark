import { LogIn, LogOut, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttendanceActions } from "@/hooks/use-attendance-actions";
import { isPastCheckinDeadline, isPastAutoCheckout } from "@/lib/utils/date";

export function AttendanceActions({ todayRec, className = "" }) {
  const { busy, blocked, handleCheckIn, handleCheckOut, isCheckinLocked } = useAttendanceActions();

  const checkinLocked = isCheckinLocked();
  const alreadyCheckedIn = !!todayRec?.checkIn;
  const alreadyCheckedOut = !!todayRec?.checkOut;

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full sm:w-auto ${className}`}>
      {/* Check In */}
      <Button
        className="flex-1 sm:flex-none"
        disabled={blocked || busy || alreadyCheckedIn || checkinLocked}
        onClick={handleCheckIn}
        title={
          checkinLocked && !alreadyCheckedIn
            ? "Check-in is locked after 12:30 PM"
            : undefined
        }
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : checkinLocked && !alreadyCheckedIn ? (
          <Clock className="size-4" />
        ) : (
          <LogIn className="size-4" />
        )}
        {checkinLocked && !alreadyCheckedIn ? "Locked after 12:30 PM" : "Check in"}
      </Button>

      {/* Check Out */}
      <Button
        variant="outline"
        className="flex-1 sm:flex-none"
        disabled={blocked || busy || !alreadyCheckedIn || alreadyCheckedOut}
        onClick={handleCheckOut}
        title={
          isPastAutoCheckout() && alreadyCheckedIn && !alreadyCheckedOut
            ? "Auto-checkout at 6:00 PM"
            : undefined
        }
      >
        <LogOut className="size-4" />
        Check out
      </Button>
    </div>
  );
}
