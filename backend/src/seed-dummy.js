import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Attendance from "./models/Attendance.js";
import Leave from "./models/Leave.js";
import Settings from "./models/Settings.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attend_easy";

function getPastDateStr(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Clearing collections…");
  await Promise.all([User.deleteMany({}), Attendance.deleteMany({}), Leave.deleteMany({}), Settings.deleteMany({})]);

  const hash = await bcrypt.hash("password", 10);
  
  // 1. Create Admin
  const admin = await User.create({
    name: "Alex Morgan", email: "admin@demo.com", passwordHash: hash, role: "admin", 
    employeeId: "EMP-0001", department: "Human Resources", designation: "HR Director", 
    phone: "+1 (555) 010-1000", active: true, approvalStatus: "approved"
  });

  // 2. Create Employees
  const employeeData = [
    { name: "Sam Employee", email: "employee@demo.com", employeeId: "EMP-0002", department: "Engineering", designation: "Software Engineer", phone: "+1 (555) 010-2000" },
    { name: "David Gonzalez", email: "david@demo.com", employeeId: "EMP-0003", department: "Engineering", designation: "Frontend Dev", phone: "+1 (555) 010-2001" },
    { name: "Sarah Chen", email: "sarah@demo.com", employeeId: "EMP-0004", department: "Design", designation: "UI/UX Designer", phone: "+1 (555) 010-2002" },
    { name: "Marcus Wright", email: "marcus@demo.com", employeeId: "EMP-0005", department: "Marketing", designation: "SEO Specialist", phone: "+1 (555) 010-2003" },
    { name: "Elena Rostova", email: "elena@demo.com", employeeId: "EMP-0006", department: "Sales", designation: "Account Executive", phone: "+1 (555) 010-2004" },
    { name: "James Holden", email: "james@demo.com", employeeId: "EMP-0007", department: "Engineering", designation: "Backend Dev", phone: "+1 (555) 010-2005" },
    { name: "Amos Burton", email: "amos@demo.com", employeeId: "EMP-0008", department: "Operations", designation: "Facilities Manager", phone: "+1 (555) 010-2006" },
  ];

  const employees = await User.insertMany(employeeData.map(e => ({
    ...e,
    passwordHash: hash,
    role: "employee",
    active: true,
    approvalStatus: "approved",
    leaveBalances: { earnedTotal: Math.floor(Math.random() * 10) + 5, compOffTotal: Math.floor(Math.random() * 3) }
  })));

  // 3. Create Settings
  await Settings.create({ key: "global", workingHours: "09:00 – 18:00" });

  // 4. Create Attendance Data for last 5 days
  const attendanceRecords = [];
  for (const emp of employees) {
    for (let i = 1; i <= 5; i++) {
      const dateStr = getPastDateStr(i);
      
      // Randomize attendance status
      const rand = Math.random();
      let status = "Present";
      let checkIn = "08:50";
      let checkOut = "18:10";

      if (rand > 0.9) {
        status = "Absent";
        checkIn = undefined;
        checkOut = undefined;
      } else if (rand > 0.75) {
        status = "Late";
        checkIn = "09:45";
      }

      // Sometimes forget checkout
      if (status !== "Absent" && Math.random() > 0.85) {
        checkOut = undefined;
      }

      attendanceRecords.push({
        user: emp._id,
        date: dateStr,
        checkIn,
        checkOut,
        status,
      });
    }
  }
  await Attendance.insertMany(attendanceRecords);

  // 5. Create Leave Requests
  const leaves = [
    {
      user: employees[0]._id, // Sam
      type: "Earned Leave",
      startDate: getPastDateStr(-2), // 2 days from now
      endDate: getPastDateStr(-4),
      duration: "full",
      reason: "Family vacation trip",
      status: "Approved",
      decidedBy: admin._id,
      decidedAt: new Date()
    },
    {
      user: employees[1]._id, // David
      type: "Earned Leave",
      startDate: getPastDateStr(-1),
      endDate: getPastDateStr(-1),
      duration: "half",
      reason: "Doctor appointment in the afternoon",
      status: "Pending"
    },
    {
      user: employees[2]._id, // Sarah
      type: "Comp-Off Leave",
      startDate: getPastDateStr(2),
      endDate: getPastDateStr(2),
      duration: "full",
      reason: "Worked on weekend for release",
      status: "Rejected",
      decidedBy: admin._id,
      decidedAt: new Date()
    },
    {
      user: employees[3]._id, // Marcus
      type: "Earned Leave",
      startDate: getPastDateStr(-5),
      endDate: getPastDateStr(-10),
      duration: "full",
      reason: "Going out of station for brother's wedding",
      status: "Pending"
    }
  ];
  await Leave.insertMany(leaves);

  console.log(`✓ Seeded ${employees.length} employees with attendance and leave records.`);
  console.log("Login with admin@demo.com / password or employee@demo.com / password");
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
