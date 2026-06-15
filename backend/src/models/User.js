import mongoose from "mongoose";

const LeaveBalancesSchema = new mongoose.Schema(
  {
    earnedTotal: { type: Number, default: 0 },
    compOffTotal: { type: Number, default: 0 },
    lastEarnedAccrualAt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    employeeId: { type: String, unique: true, sparse: true },
    department: String,
    designation: String,
    phone: { type: String, unique: true, sparse: true, index: true },
    active: { type: Boolean, default: true },
    leaveBalances: { type: LeaveBalancesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Only index real emails — many users can omit email (sign up with phone + employee ID only)
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $type: "string", $gt: "" } } }
);

UserSchema.pre("validate", function stripEmptyEmail(next) {
  if (this.email === "" || this.email == null) {
    this.email = undefined;
  }
  next();
});

UserSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.__v;
  return o;
};

export default mongoose.model("User", UserSchema);
