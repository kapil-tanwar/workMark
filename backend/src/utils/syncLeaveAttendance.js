import Attendance from "../models/Attendance.js";
import { dateRange } from "./dateRange.js";

/** Mark attendance as Leave for each day in an approved leave window. */
export async function syncApprovedLeaveAttendance(leave) {
  const dates = dateRange(leave.startDate, leave.endDate);
  await Promise.all(
    dates.map((date) =>
      Attendance.findOneAndUpdate(
        { user: leave.user, date },
        {
          $setOnInsert: { user: leave.user, date },
          $set: { status: "Leave" },
        },
        { upsert: true, new: true }
      )
    )
  );
}

/** Remove Leave-only attendance rows when a leave is rejected (keeps check-in data). */
export async function clearLeaveAttendance(leave) {
  const dates = dateRange(leave.startDate, leave.endDate);
  await Attendance.updateMany(
    {
      user: leave.user,
      date: { $in: dates },
      status: "Leave",
      checkIn: { $exists: false },
      checkOut: { $exists: false },
    },
    { $set: { status: "Absent" } }
  );
}
