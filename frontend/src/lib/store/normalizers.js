export function normAttendance(r) {
  const userId = r.user?._id || r.user || r.userId;
  return {
    id: r._id || r.id,
    userId: String(userId),
    date: r.date,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    status: r.status,
    userName: r.user?.name,
    userEmployeeId: r.user?.employeeId,
  };
}

export function normLeave(l) {
  const userId = l.user?._id || l.user || l.userId;
  return {
    id: l._id || l.id,
    userId: String(userId),
    type: l.type,
    startDate: l.startDate,
    endDate: l.endDate,
    reason: l.reason,
    status: l.status,
    appliedAt: l.createdAt || l.appliedAt,
    userName: l.user?.name,
    userDepartment: l.user?.department,
  };
}
