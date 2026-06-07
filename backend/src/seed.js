import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Attendance from "./models/Attendance.js";
import Leave from "./models/Leave.js";
import Settings from "./models/Settings.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/attend_easy";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected. Clearing collections…");
  await Promise.all([User.deleteMany({}), Attendance.deleteMany({}), Leave.deleteMany({}), Settings.deleteMany({})]);

  const hash = await bcrypt.hash("password", 10);
  const users = await User.insertMany([
    { name: "Alex Morgan", email: "admin@demo.com", passwordHash: hash, role: "admin", employeeId: "EMP-0001", department: "Human Resources", designation: "HR Director", phone: "+1 (555) 010-1000" },
  ]);

  await Settings.create({ key: "global" });

  console.log(`✓ Seeded ${users.length} admin user. Add employees via signup or the admin panel.`);
  console.log("Login with admin@demo.com / password");
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
