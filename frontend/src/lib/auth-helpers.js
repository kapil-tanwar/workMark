export function normalizeEmployeeId(id) {
    return String(id || "").trim().toUpperCase();
}

export function findUserByLoginIdentifier(users, identifier) {
    const raw = identifier.trim();
    if (!raw)
        return undefined;
    const lower = raw.toLowerCase();
    const empNorm = normalizeEmployeeId(raw);
    return users.find((u) => u.email.toLowerCase() === lower ||
        (u.employeeId && normalizeEmployeeId(u.employeeId) === empNorm));
}

export function isEmployeeIdTaken(users, employeeId, excludeUserId) {
    const norm = normalizeEmployeeId(employeeId);
    if (!norm)
        return false;
    return users.some((u) => u.employeeId &&
        normalizeEmployeeId(u.employeeId) === norm &&
        u.id !== excludeUserId);
}

export function validateEmployeeId(employeeId) {
    const norm = normalizeEmployeeId(employeeId);
    if (!norm)
        throw new Error("Employee ID is required");
    if (norm.length < 2 || norm.length > 32)
        throw new Error("Employee ID must be 2–32 characters");
    return norm;
}
