import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import Settings from "../models/Settings.js";
import { getISTDateStr, getISTTimeStr } from "./timezone.js";

// Helper to parse workingHours (e.g. "09:00 – 18:00")
function parseWorkingHours(workingHoursStr = "09:00 – 18:00") {
  const parts = workingHoursStr.split(/[-–—]/).map(s => s.trim());
  const start = parts[0] || "09:00";
  const end = parts[1] || "18:00";
  return { start, end };
}

// Helper to get dates range array [startDateStr, endDateStr]
function getDatesInRange(startDateStr, endDateStr) {
  const dates = [];
  let cursor = new Date(startDateStr);
  const end = new Date(endDateStr);
  cursor.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Helper to check if date string is a Sunday
function isSundayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

// Helper to get yesterday's date
function getYesterdayDateStr(todayStr) {
  const [y, m, d] = todayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function processDailyAttendance() {
  const settings = (await Settings.findOne({ key: "global" })) || (await Settings.create({ key: "global" }));
  const { end: dutyEndTime } = parseWorkingHours(settings.workingHours);

  const now = new Date();
  const todayStr = getISTDateStr(now);
  const currentTimeStr = getISTTimeStr(now);

  // If today's duty time has ended, we can process up to today. Otherwise, up to yesterday.
  const maxDateStr = currentTimeStr >= dutyEndTime ? todayStr : getYesterdayDateStr(todayStr);

  // Find all active employees
  const employees = await User.find({ role: "employee", active: true });

  for (const emp of employees) {
    const startStr = getISTDateStr(emp.createdAt);
    if (startStr > maxDateStr) continue; // Joined after the target window

    const dates = getDatesInRange(startStr, maxDateStr);

    // Fetch existing attendance records and approved leaves for this user in the window
    const [records, leaves] = await Promise.all([
      Attendance.find({ user: emp._id, date: { $gte: startStr, $lte: maxDateStr } }),
      Leave.find({ user: emp._id, status: "Approved", startDate: { $lte: maxDateStr }, endDate: { $gte: startStr } })
    ]);

    const recordMap = new Map(records.map(r => [r.date, r]));
    const isOnLeave = (dateStr) => leaves.some(l => dateStr >= l.startDate && dateStr <= l.endDate);

    for (const date of dates) {
      if (isSundayDate(date)) continue; // Sundays are off

      const existing = recordMap.get(date);
      if (existing) {
        // Case 1: Checked in but forgot to check out
        if (existing.checkIn && !existing.checkOut) {
          existing.checkOut = dutyEndTime;
          await existing.save();
        }
      } else {
        // Case 2: No attendance record exists for this day
        if (isOnLeave(date)) {
          // They were on approved leave, create "Leave" record
          try {
            await Attendance.create({ user: emp._id, date, status: "Leave" });
          } catch (e) {
            if (e.code !== 11000) throw e;
          }
        } else {
          // They were absent!
          try {
            // Create Absent record
            await Attendance.create({ user: emp._id, date, status: "Absent" });
            // Deduct 1 earned leave
            await User.findByIdAndUpdate(emp._id, {
              $inc: { "leaveBalances.earnedTotal": -1 }
            });
          } catch (e) {
            if (e.code !== 11000) throw e;
          }
        }
      }
    }
  }
}

export function scheduleDailyAttendanceProcessing() {
  // Run on startup (after 5 seconds to let DB stabilize)
  setTimeout(async () => {
    try {
      console.log("Starting daily attendance catch-up processing...");
      await processDailyAttendance();
      console.log("Daily attendance catch-up processing completed.");
    } catch (err) {
      console.error("Startup attendance processing failed:", err);
    }
  }, 5000);

  // Also run every hour
  setInterval(async () => {
    try {
      console.log("Running hourly daily attendance processing...");
      await processDailyAttendance();
      console.log("Hourly daily attendance processing completed.");
    } catch (err) {
      console.error("Hourly attendance processing failed:", err);
    }
  }, 60 * 60 * 1000);
}
