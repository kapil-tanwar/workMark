import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "employee"], default: "employee" },
    employeeId: { type: String, unique: true, sparse: true },
    department: String,
    designation: String,
    phone: { type: String, unique: true, sparse: true, index: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const o = this.toObject();
  delete o.passwordHash;
  delete o.__v;
  return o;
};

export default mongoose.model("User", UserSchema);
