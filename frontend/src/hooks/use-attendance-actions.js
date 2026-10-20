import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { checkIn, checkOut, store } from "@/lib/store";
import { isAttendanceBlocked, isPastCheckinDeadline, isPastAutoCheckout, getAutoCheckoutTime } from "@/lib/utils/date";
import { useAuth } from "@/lib/auth-context";
import { todayISO, isDateInRange } from "@/lib/utils/date";

export function useAttendanceActions() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const blocked = isAttendanceBlocked();
  const autoCheckoutFiredRef = useRef(false);

  /* ── Determine if user has an approved leave for today ── */
  function hasLeaveToday() {
    if (!user) return false;
    const today = todayISO();
    const leaves = store.getLeaves().filter((l) => l.userId === user.id);
    return leaves.some(
      (l) => l.status === "Approved" && isDateInRange(today, l.startDate, l.endDate)
    );
  }

  /* ── Check if today's attendance record exists ── */
  function getTodayRec() {
    if (!user) return null;
    const today = todayISO();
    return store.getAttendance().find((a) => a.userId === user.id && a.date === today) || null;
  }

  /* ── Auto-checkout at 6:00 PM ── */
  useEffect(() => {
    if (blocked) return;

    const tick = setInterval(async () => {
      if (autoCheckoutFiredRef.current) return;
      if (!isPastAutoCheckout()) return;

      const rec = getTodayRec();
      if (!rec?.checkIn || rec?.checkOut) return; // not checked in, or already checked out

      autoCheckoutFiredRef.current = true;
      try {
        await checkOut();
        toast.info("You have been automatically checked out at 6:00 PM.");
      } catch {
        // silently fail — they may already be checked out
      }
    }, 30_000); // check every 30 seconds

    return () => clearInterval(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  async function handleCheckIn() {
    if (blocked) {
      toast.error("Attendance is not available on Sundays.");
      return;
    }

    // 12:30 PM cutoff: only block if no approved leave today
    if (isPastCheckinDeadline() && !hasLeaveToday()) {
      toast.error(
        "Check-in is no longer available after 12:30 PM. You can check in tomorrow.",
        { duration: 5000 }
      );
      return;
    }

    setBusy(true);
    try {
      await checkIn();
      toast.success("Checked in successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut() {
    if (blocked) {
      toast.error("Attendance is not available on Sundays.");
      return;
    }
    setBusy(true);
    try {
      await checkOut();
      toast.success("Checked out successfully!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  /* Whether check-in button should be disabled due to time cutoff */
  function isCheckinLocked() {
    if (blocked) return true;
    if (isPastCheckinDeadline() && !hasLeaveToday()) return true;
    return false;
  }

  return { busy, blocked, handleCheckIn, handleCheckOut, isCheckinLocked };
}
