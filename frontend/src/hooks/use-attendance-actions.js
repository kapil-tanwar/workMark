import { useState } from "react";
import { toast } from "sonner";
import { checkIn, checkOut } from "@/lib/store";
import { isAttendanceBlocked } from "@/lib/utils/date";

export function useAttendanceActions() {
  const [busy, setBusy] = useState(false);
  const blocked = isAttendanceBlocked();

  async function handleCheckIn() {
    if (blocked) {
      toast.error("Attendance is not available on Sundays.");
      return;
    }
    setBusy(true);
    try {
      await checkIn();
      toast.success("Checked in");
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
      toast.success("Checked out");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return { busy, blocked, handleCheckIn, handleCheckOut };
}
