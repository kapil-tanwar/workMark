import mongoose from "mongoose";

const LeaveBalancesSchema = new mongoose.Schema(
  {
    earnedTotal: { type: Number, default: 0 },
    compOffTotal: { type: Number, default: 0 },
    lastEarnedAccrualAt: { type: Date },
  },
  { _id: false },
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    employeeId: { type: String, unique: true, sparse: true },
    department: String,
    designation: String,
    phone: { type: String, unique: true, sparse: true, index: true },
    active: { type: Boolean, default: true },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    isDummy: { type: Boolean, default: false },
    leaveBalances: { type: LeaveBalancesSchema, default: () => ({}) },
    pendingTotpSecret: { type: String },
    totpSecret: { type: String },
    tokenVersion: { type: Number, default: 0 },
    is2faEnabled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

UserSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.__v;
  delete o.pendingTotpSecret;
  delete o.totpSecret;
  return o;
};

export default mongoose.model("User", UserSchema);
