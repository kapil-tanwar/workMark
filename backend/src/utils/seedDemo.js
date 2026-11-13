import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import { getISTDateStr } from "./timezone.js";

export async function ensureDemoUsers() {
  try {
    const passwordHash = await bcrypt.hash("password", 10);

    // 1. Mark any previously generated demo employees as isDummy: true
    await User.updateMany(
      {
        $or: [
          { email: /@workflow\.(hr|demo)$/i },
          { employeeId: /^EMP-(12|13|14|15|16)/i },
          { employeeId: /^DEMO-/i },
        ],
      },
      { $set: { isDummy: true } }
    );

    // 2. Admin Demo User: admin@admin.com / admin00 / password
    const adminQuery = {
      $or: [
        { email: "admin@admin.com" },
        { employeeId: "ADMIN00" },
      ],
    };

    let adminUser = await User.findOne(adminQuery);
    if (!adminUser) {
      adminUser = new User({
        name: "Demo Admin",
        email: "admin@admin.com",
        employeeId: "ADMIN00",
        passwordHash,
        role: "admin",
        phone: "+919876500001",
        department: "Management",
        designation: "Administrator",
        active: true,
        approvalStatus: "approved",
        isDummy: true,
      });
      await adminUser.save();
      console.log("Created demo admin account (admin@admin.com / ADMIN00)");
    } else {
      adminUser.passwordHash = passwordHash;
      adminUser.email = "admin@admin.com";
      adminUser.employeeId = "ADMIN00";
      adminUser.role = "admin";
      adminUser.active = true;
      adminUser.approvalStatus = "approved";
      adminUser.isDummy = true;
      await adminUser.save();
    }

    // 3. Employee Demo User: employee@employee.com / employee00 / password
    const employeeQuery = {
      $or: [
        { email: "employee@employee.com" },
        { employeeId: "EMPLOYEE00" },
      ],
    };

    let empUser = await User.findOne(employeeQuery);
    if (!empUser) {
      empUser = new User({
        name: "Demo Employee",
        email: "employee@employee.com",
        employeeId: "EMPLOYEE00",
        passwordHash,
        role: "employee",
        phone: "+919876500002",
        department: "Engineering",
        designation: "Software Engineer",
        active: true,
        approvalStatus: "approved",
        isDummy: true,
        leaveBalances: {
          earnedTotal: 12,
          compOffTotal: 2,
          lastEarnedAccrualAt: new Date(),
        },
      });
      await empUser.save();
      console.log("Created demo employee account (employee@employee.com / EMPLOYEE00)");
    } else {
      empUser.passwordHash = passwordHash;
      empUser.email = "employee@employee.com";
      empUser.employeeId = "EMPLOYEE00";
      empUser.role = "employee";
      empUser.active = true;
      empUser.approvalStatus = "approved";
      empUser.isDummy = true;
      await empUser.save();
    }

    // 4. Ensure realistic sample employees for the demo environment with Indian names
    const demoEmployees = [
      {
        name: "Aarav Sharma",
        email: "aarav.sharma@workflow.hr",
        employeeId: "EMP-12",
        department: "Engineering",
        designation: "Senior Frontend Engineer",
        phone: "+91 98765 41201",
      },
      {
        name: "Priya Nair",
        email: "priya.nair@workflow.hr",
        employeeId: "EMP-13",
        department: "Design",
        designation: "Lead UI/UX Designer",
        phone: "+91 98765 29102",
      },
    ];

    for (const de of demoEmployees) {
      const existing = await User.findOne({
        $or: [{ email: de.email }, { employeeId: de.employeeId }],
      });
      if (!existing) {
        await User.create({
          name: de.name,
          email: de.email,
          employeeId: de.employeeId,
          passwordHash,
          role: "employee",
          phone: de.phone,
          department: de.department,
          designation: de.designation,
          active: true,
          approvalStatus: "approved",
          isDummy: true,
          leaveBalances: {
            earnedTotal: 12,
            compOffTotal: 1,
            lastEarnedAccrualAt: new Date(),
          },
        });
      } else {
        existing.isDummy = true;
        await existing.save();
      }
    }

    // 5. Ensure sample attendance for Demo Employee so demo dashboard is populated
    const today = getISTDateStr();
    const existingAtt = await Attendance.findOne({ user: empUser._id, date: today });
    if (!existingAtt) {
      await Attendance.create({
        user: empUser._id,
        date: today,
        checkIn: "09:05",
        checkOut: "18:00",
        status: "Present",
      });
    }

  } catch (err) {
    console.error("Error ensuring demo users:", err.message);
  }
}
