import * as api from "@/lib/api";
import { computeLeaveBalance, canRequestLeave } from "@/lib/utils/leave-balance";
import { cache, emitChange } from "./cache";
import { normAttendance, normLeave } from "./normalizers";

export const store = {
  getUsers: () => cache.users,
  getAttendance: () => cache.attendance,
  getLeaves: () => cache.leaves,
  getSettings: () => cache.settings,
  setSettings: async (v) => {
    cache.settings = await api.patchSettings(v);
    emitChange();
  },
};

export async function refreshStore() {
  const [users, attendance, leaves, settings] = await Promise.all([
    api.getEmployees(),
    api.getAttendance(),
    api.getLeaves(),
    api.getSettings(),
  ]);
  cache.users = users;
  cache.attendance = attendance.map(normAttendance);
  cache.leaves = leaves.map(normLeave);
  cache.settings = settings;
  emitChange();
}

export function totalHours(rec) {
  if (!rec.checkIn || !rec.checkOut) return "—";
  const [h1, m1] = rec.checkIn.split(":").map(Number);
  const [h2, m2] = rec.checkOut.split(":").map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins <= 0) return "—";
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function currentMonthCounts(userId) {
  const ym = new Date().toISOString().slice(0, 7);
  const recs = cache.attendance.filter((a) => a.userId === userId && a.date.startsWith(ym));
  return {
    present: recs.filter((r) => r.status === "Present" || r.status === "Late").length,
    absent: recs.filter((r) => r.status === "Absent").length,
    late: recs.filter((r) => r.status === "Late").length,
    leave: recs.filter((r) => r.status === "Leave").length,
  };
}

export function leaveBalance(userId) {
  const leaves = cache.leaves.filter((l) => l.userId === userId);
  return computeLeaveBalance(leaves, cache.settings.leaveAllocation, { includePending: false });
}

export function leaveBalanceWithPending(userId) {
  const leaves = cache.leaves.filter((l) => l.userId === userId);
  return computeLeaveBalance(leaves, cache.settings.leaveAllocation, { includePending: true });
}

export { canRequestLeave };

export async function checkIn() {
  const record = await api.checkIn();
  const norm = normAttendance(record);
  const idx = cache.attendance.findIndex((a) => a.userId === norm.userId && a.date === norm.date);
  if (idx >= 0) cache.attendance[idx] = norm;
  else cache.attendance.unshift(norm);
  emitChange();
  return norm;
}

export async function checkOut() {
  const record = await api.checkOut();
  const norm = normAttendance(record);
  const idx = cache.attendance.findIndex((a) => a.userId === norm.userId && a.date === norm.date);
  if (idx >= 0) cache.attendance[idx] = norm;
  emitChange();
  return norm;
}

export async function submitLeave(input) {
  const check = canRequestLeave(
    cache.leaves.filter((l) => l.userId === input.userId),
    cache.settings.leaveAllocation,
    input.type,
    input.startDate,
    input.endDate
  );
  if (!check.ok) throw new Error(check.message);
  const leave = await api.createLeave({
    type: input.type,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
  });
  cache.leaves.unshift(normLeave(leave));
  emitChange();
  return normLeave(leave);
}

export async function cancelLeave(id) {
  await api.deleteLeave(id);
  cache.leaves = cache.leaves.filter((l) => l.id !== id);
  emitChange();
}

export async function decideLeave(id, status) {
  const leave = status === "Approved" ? await api.approveLeave(id) : await api.rejectLeave(id);
  const norm = normLeave(leave);
  const idx = cache.leaves.findIndex((l) => l.id === id);
  if (idx >= 0) cache.leaves[idx] = norm;
  await refreshStore();
  return norm;
}

export async function saveEmployee(edit, form, password = "password") {
  const payload = {
    name: form.name,
    employeeId: form.employeeId,
    department: form.department,
    designation: form.designation,
    phone: form.phone,
    email: form.email?.trim() || "",
  };
  if (edit) {
    const updated = await api.updateEmployee(edit.id, payload);
    const idx = cache.users.findIndex((u) => u.id === edit.id);
    if (idx >= 0) cache.users[idx] = updated;
  } else {
    const created = await api.createEmployee({ ...payload, password, role: "employee" });
    cache.users.unshift(created);
  }
  emitChange();
}

export async function toggleEmployeeActive(user) {
  const updated = await api.updateEmployee(user.id, { active: !user.active });
  const idx = cache.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) cache.users[idx] = updated;
  emitChange();
}

export async function deleteEmployee(userId) {
  await api.deleteEmployee(userId);
  cache.users = cache.users.filter((u) => u.id !== userId);
  emitChange();
}
