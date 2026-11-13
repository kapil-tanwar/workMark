/**
 * End-to-end tests for individual + bulk employee onboarding.
 * Spawns the real API against a throw-away MongoDB database.
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27017/workmark_test npm test
 *
 * The database name MUST end in "_test": it is dropped before the run.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import UserModel from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/workmark_test";
const PORT = process.env.TEST_PORT || "4199";
const BASE = `http://127.0.0.1:${PORT}`;
let server;
let adminToken;
let employeeToken;

/* ───────── helpers ───────── */
async function api(path, { method = "GET", token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json); }
  if (form) body = form;
  const res = await fetch(BASE + path, { method, headers, body });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, data, res };
}

function fileForm(content, name, type = "application/octet-stream") {
  const f = new FormData();
  f.append("file", new Blob([content], { type }), name);
  return f;
}
const csvFile = (text, name = "employees.csv") => fileForm(text, name, "text/csv");
const HEADER = "Name,Employee ID,Phone,Email,Department,Designation,Earned Leaves,Comp-Off Leaves";

async function xlsxBuffer(rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Employees");
  rows.forEach((r) => ws.addRow(r));
  return Buffer.from(await wb.xlsx.writeBuffer());
}

let seq = 0;
const uniq = () => ++seq;
function row(over = {}) {
  const n = uniq();
  const r = { name: `Test User ${n}`, id: `T${String(n).padStart(4, "0")}`, phone: `+9190000${String(n).padStart(5, "0")}`, email: `t${n}@example.com`, dept: "Eng", desig: "Dev", earned: "", comp: "", ...over };
  return [r.name, r.id, r.phone, r.email, r.dept, r.desig, r.earned, r.comp].join(",");
}
const csv = (...rows) => [HEADER, ...rows].join("\n");

/* ───────── lifecycle ───────── */
before(async () => {
  assert.match(new URL(MONGODB_URI).pathname, /_test$/, "refusing to run: database name must end with _test");
  await mongoose.connect(MONGODB_URI);
  await mongoose.connection.dropDatabase();

  server = spawn("node", ["src/index.js"], {
    env: { ...process.env, PORT, MONGODB_URI, JWT_SECRET: "test-secret-test-secret-test-secret-123456", CORS_ORIGIN: "http://localhost:8080", APP_URL: "http://localhost:8080" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr.on("data", (d) => process.env.DEBUG_API && process.stderr.write(d));
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + "/health")).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }

  // first real admin is auto-approved
  const s = await api("/api/auth/signup", { method: "POST", json: { name: "Root Admin", email: "root@corp.test", password: "adminpass1", role: "admin", employeeId: "ROOT01", phone: "+919000000001" } });
  assert.equal(s.status, 201, JSON.stringify(s.data));
  adminToken = s.data.token;
  const e = await api("/api/auth/signup", { method: "POST", json: { name: "Plain Employee", email: "plain@corp.test", password: "emppass12", role: "employee", employeeId: "PLAIN01", phone: "+919000000002" } });
  employeeToken = e.data.token;
});

after(async () => {
  server?.kill();
  await mongoose.disconnect();
});

/* ───────── 1. individual add still works ───────── */
test("1. admin can still add a single employee manually", async () => {
  const r = await api("/api/employees", { method: "POST", token: adminToken, json: { name: "Manual One", email: "manual1@corp.test", password: "temp1234", employeeId: "man-001", phone: "+919111111111", department: "Ops", designation: "Lead", role: "employee" } });
  assert.equal(r.status, 201);
  assert.equal(r.data.employee.employeeId, "MAN-001");
  assert.equal(r.data.employee.passwordHash, undefined);
  assert.equal(r.data.employee.invitePending, false);
  // duplicate id still rejected by the original rules
  const dup = await api("/api/employees", { method: "POST", token: adminToken, json: { name: "X", password: "temp1234", employeeId: "MAN-001", phone: "+919111111112" } });
  assert.equal(dup.status, 409);
  // and the manually-created employee can log in with the password the admin set
  const login = await api("/api/auth/login", { method: "POST", json: { email: "MAN-001", password: "temp1234" } });
  assert.equal(login.status, 200);
});

/* ───────── 8. access control ───────── */
test("8. RBAC: employees and anonymous callers cannot use any import endpoint", async () => {
  const body = () => csvFile(csv(row()));
  for (const [method, path, form] of [["GET", "/api/employees/bulk-import/template"], ["GET", "/api/employees/bulk-import/spec"], ["POST", "/api/employees/bulk-import/preview", body()], ["POST", "/api/employees/bulk-import", body()]]) {
    const emp = await api(path, { method, token: employeeToken, form });
    assert.equal(emp.status, 403, `employee ${method} ${path}`);
    const anon = await api(path, { method, form });
    assert.equal(anon.status, 401, `anon ${method} ${path}`);
  }
  const bad = await api("/api/employees/bulk-import/template", { token: "garbage" });
  assert.equal(bad.status, 401);
});

/* ───────── template ───────── */
test("template downloads (xlsx + csv) are valid and re-importable", async () => {
  const x = await api("/api/employees/bulk-import/template?format=xlsx", { token: adminToken });
  assert.equal(x.status, 200);
  assert.match(x.res.headers.get("content-disposition"), /\.xlsx/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(x.data);
  assert.equal(wb.worksheets[0].getRow(1).getCell(1).value, "Name");
  assert.ok(wb.worksheets.some((w) => w.name === "Instructions"));

  const c = await api("/api/employees/bulk-import/template?format=csv", { token: adminToken });
  assert.equal(c.status, 200);
  assert.match(c.data.toString(), /^Name,Employee ID,Phone,Email/);

  const pv = await api("/api/employees/bulk-import/preview", { method: "POST", token: adminToken, form: fileForm(x.data, "template.xlsx") });
  assert.equal(pv.status, 200);
  assert.equal(pv.data.summary.total, 2);
  assert.equal(pv.data.summary.valid, 2);
});

/* ───────── 2. successful multi-import + onboarding ───────── */
test("2. imports multiple employees, preview writes nothing, invitations are secure", async () => {
  const a = row({ name: "Aarav Sharma" }), b = row({ name: "Priya Nair", email: "" }), c = row({ earned: "12", comp: "2" });
  const file = csv(a, b, c);

  const pv = await api("/api/employees/bulk-import/preview", { method: "POST", token: adminToken, form: csvFile(file) });
  assert.deepEqual(pv.data.summary, { total: 3, valid: 3, invalid: 0, duplicates: 0 });
  const before = await User().countDocuments();

  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(file) });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.deepEqual(r.data.summary, { total: 3, imported: 3, failed: 0, duplicates: 0 });
  assert.equal(await User().countDocuments(), before + 3);
  assert.equal(r.data.invitations.length, 3);

  const inv = r.data.invitations[0];
  assert.match(inv.inviteUrl, /^http:\/\/localhost:8080\/accept-invite\/[0-9a-f]{64}$/);
  const token = inv.inviteUrl.split("/").pop();

  // stored securely: role employee, no plaintext token, unusable password
  const stored = await User().findOne({ employeeId: inv.employeeId }).lean();
  assert.equal(stored.role, "employee");
  assert.equal(stored.invitePending, true);
  assert.notEqual(stored.inviteTokenHash, token);
  assert.equal(stored.inviteTokenHash.length, 64);
  assert.ok(stored.passwordHash.startsWith("$2"));
  // leave balances follow the same rules as individual creation
  const withBal = await User().findOne({ employeeId: r.data.invitations[2].employeeId }).lean();
  assert.equal(withBal.leaveBalances.earnedTotal, 12);
  assert.equal(withBal.leaveBalances.compOffTotal, 2);
  assert.equal(stored.leaveBalances.earnedTotal, 1.5, "blank earned leaves = this month's accrual");

  // list endpoint never leaks token hash
  const list = await api("/api/employees", { token: adminToken });
  assert.ok(!JSON.stringify(list.data).includes("inviteTokenHash"));
  assert.ok(list.data.employees.find((e) => e.employeeId === inv.employeeId).invitePending);

  // cannot log in before accepting (even with guesses)
  const early = await api("/api/auth/login", { method: "POST", json: { email: inv.employeeId, password: "password" } });
  assert.equal(early.status, 403);

  // public invite lookup
  const look = await api(`/api/auth/invite/${token}`);
  assert.equal(look.status, 200);
  assert.equal(look.data.invite.employeeId, inv.employeeId);
  assert.equal((await api(`/api/auth/invite/${"0".repeat(64)}`)).status, 410);

  // accept: weak password rejected, strong accepted, single use
  assert.equal((await api("/api/auth/invite/accept", { method: "POST", json: { token, password: "123" } })).status, 400);
  const acc = await api("/api/auth/invite/accept", { method: "POST", json: { token, password: "My-new-pass-9" } });
  assert.equal(acc.status, 200);
  assert.equal((await api("/api/auth/invite/accept", { method: "POST", json: { token, password: "Another-pass-9" } })).status, 410, "link is single-use");
  const login = await api("/api/auth/login", { method: "POST", json: { email: inv.employeeId, password: "My-new-pass-9" } });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.role, "employee");

  // existing attendance + leave endpoints keep working for the onboarded user
  assert.equal((await api("/api/attendance", { token: login.data.token })).status, 200);
  assert.equal((await api("/api/leaves", { token: login.data.token })).status, 200);
  assert.equal((await api("/api/auth/me", { token: login.data.token })).data.user.invitePending, false);
});

test("expired invitations are rejected and admin can regenerate the link", async () => {
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(csv(row())) });
  const inv = r.data.invitations[0];
  const token = inv.inviteUrl.split("/").pop();
  await User().updateOne({ employeeId: inv.employeeId }, { inviteExpiresAt: new Date(Date.now() - 1000) });
  assert.equal((await api(`/api/auth/invite/${token}`)).status, 410);
  assert.equal((await api("/api/auth/invite/accept", { method: "POST", json: { token, password: "Valid-pass-1" } })).status, 410);

  const id = (await User().findOne({ employeeId: inv.employeeId }))._id;
  assert.equal((await api(`/api/employees/${id}/invite`, { method: "POST", token: employeeToken })).status, 403);
  const re = await api(`/api/employees/${id}/invite`, { method: "POST", token: adminToken });
  assert.equal(re.status, 200);
  const fresh = re.data.inviteUrl.split("/").pop();
  assert.equal((await api("/api/auth/invite/accept", { method: "POST", json: { token: fresh, password: "Valid-pass-1" } })).status, 200);
  // once set, a new link cannot be issued
  assert.equal((await api(`/api/employees/${id}/invite`, { method: "POST", token: adminToken })).status, 400);
});

/* ───────── 3. invalid files ───────── */
test("3. invalid files are rejected with clear errors", async () => {
  const imp = (form) => api("/api/employees/bulk-import/preview", { method: "POST", token: adminToken, form });
  assert.equal((await imp(fileForm("hello", "notes.txt"))).status, 400);
  assert.equal((await imp(fileForm("hello", "evil.exe"))).status, 400);
  const fake = await imp(fileForm("this is not a zip", "fake.xlsx"));
  assert.equal(fake.status, 400);
  assert.match(fake.data.error, /does not match/);
  assert.equal((await imp(fileForm(Buffer.from([0x68, 0x00, 0x69]), "bin.csv"))).status, 400);
  assert.equal((await imp(fileForm("", "empty.csv"))).status, 400);
  assert.equal((await imp(csvFile("Name,Phone\nA,1234567"))).status, 400); // missing Employee ID column
  const miss = await imp(csvFile("Name,Phone\nA,1234567"));
  assert.match(miss.data.error, /Missing required column: Employee ID/);
  assert.equal((await imp(csvFile(HEADER))).status, 400); // header only
  const noFile = await api("/api/employees/bulk-import/preview", { method: "POST", token: adminToken, form: new FormData() });
  assert.equal(noFile.status, 400);
  const big = await imp(csvFile("x".repeat(2.5 * 1024 * 1024)));
  assert.equal(big.status, 413);
});

/* ───────── 4/5/6/7. validation + duplicates + mixed ───────── */
test("4-7. mixed file: every problem is reported per row, valid rows still import", async () => {
  // seed an existing employee to collide with
  await api("/api/employees", { method: "POST", token: adminToken, json: { name: "Existing", email: "existing@corp.test", password: "temp1234", employeeId: "EXIST1", phone: "+919222222222" } });

  const ok1 = row({ name: "Good One" }), ok2 = row({ name: "Good Two" });
  const dupFileEmail = row({ email: "shared@corp.test" });
  const dupFileEmail2 = row({ email: "SHARED@corp.test" });
  const dupFileId = row({ id: "DUPID1" }), dupFileId2 = row({ id: "dupid1" });
  const dupDbEmail = row({ email: "existing@corp.test" });
  const dupDbId = row({ id: "exist1" });
  const dupDbPhone = row({ phone: "+919222222222" });
  const noName = row({ name: "" });
  const noId = row({ id: "" });
  const noPhone = row({ phone: "" });
  const badEmail = row({ email: "not-an-email" });
  const shortId = row({ id: "A" });
  const badPhone = row({ phone: "abc-defg" });
  const adminRole = [row(), "admin"]; // role column added below
  const formula = row({ name: "=HYPERLINK(\"http://evil\")" });
  const negLeave = row({ earned: "-3" });
  const nanLeave = row({ comp: "lots" });
  const longName = row({ name: "N".repeat(121) });

  const text = [HEADER, ok1, dupFileEmail, dupFileEmail2, dupFileId, dupFileId2, dupDbEmail, dupDbId, dupDbPhone, noName, noId, noPhone, badEmail, shortId, badPhone, formula, negLeave, nanLeave, longName, ok2].join("\n");

  const pv = await api("/api/employees/bulk-import/preview", { method: "POST", token: adminToken, form: csvFile(text) });
  assert.equal(pv.status, 200);
  const by = (n) => pv.data.rows[n]; // 0-based in file order
  assert.equal(by(0).status, "valid");
  assert.equal(by(1).status, "valid", "first occurrence of a shared email is kept");
  assert.equal(by(2).status, "duplicate");
  assert.match(by(2).errors.join(), /Email duplicates row 3/);
  assert.equal(by(4).status, "duplicate");
  assert.match(by(4).errors.join(), /Employee ID duplicates row 5/);
  assert.match(by(5).errors.join(), /Email existing@corp.test already exists/);
  assert.match(by(6).errors.join(), /Employee ID EXIST1 already exists/);
  assert.match(by(7).errors.join(), /Phone number is already in use/);
  assert.match(by(8).errors.join(), /Name is required/);
  assert.match(by(9).errors.join(), /Employee ID/);
  assert.match(by(10).errors.join(), /Phone/);
  assert.match(by(11).errors.join(), /Email format is invalid/);
  assert.match(by(12).errors.join(), /Employee ID must be 2/);
  assert.match(by(13).errors.join(), /Phone may only contain/);
  assert.match(by(14).errors.join(), /must not start with =/);
  assert.match(by(15).errors.join(), /cannot be negative/);
  assert.match(by(16).errors.join(), /must be a number/);
  assert.match(by(17).errors.join(), /at most 120/);
  assert.equal(by(18).status, "valid");
  assert.equal(pv.data.rows[0].rowNumber, 2, "row numbers match the spreadsheet (header = row 1)");
  const s = pv.data.summary;
  assert.equal(s.total, 19);
  assert.equal(s.valid + s.invalid + s.duplicates, s.total);
  assert.equal(s.valid, 4, "ok1, ok2 and the first occurrence of each duplicated pair");
  assert.equal(by(3).status, "valid");

  const before = await User().countDocuments();
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(text) });
  assert.equal(r.status, 201);
  assert.equal(r.data.summary.imported, 4);
  assert.equal(r.data.summary.total, 19);
  assert.equal(r.data.summary.failed + r.data.summary.duplicates, 15);
  assert.equal(await User().countDocuments(), before + 4, "only the valid rows were inserted");
  assert.equal(r.data.invitations.length, 4);

  // re-importing the exact same file creates nothing new (idempotent on duplicates)
  const again = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(csv(ok1, ok2)) });
  assert.equal(again.status, 200);
  assert.equal(again.data.summary.imported, 0);
  assert.equal(again.data.summary.duplicates, 2);
  assert.equal(await User().countDocuments(), before + 4);
});

test("admin privileges can never be granted through a spreadsheet", async () => {
  const text = "Name,Employee ID,Phone,Role\nEvil Admin,EVIL01,+919333333331,admin\nGood Emp,GOOD01,+919333333332,employee\nBlank Role,GOOD02,+919333333333,";
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(text) });
  assert.equal(r.data.summary.imported, 2);
  assert.match(r.data.rows[0].errors.join(), /not allowed/);
  assert.equal(await User().countDocuments({ employeeId: "EVIL01" }), 0);
  for (const id of ["GOOD01", "GOOD02"]) assert.equal((await User().findOne({ employeeId: id })).role, "employee");
});

/* ───────── xlsx specifics ───────── */
test("xlsx: header aliases, numeric cells, leading zeros and blank rows are handled", async () => {
  const buf = await xlsxBuffer([
    ["Full Name", "Emp ID", "Mobile", "E-mail", "Dept"],
    ["Excel User", "007", 9876543210, "excel@corp.test", "Ops"],
    [],
    ["Rich User", "X-100", "+91 98765 00000", { text: "rich@corp.test", hyperlink: "mailto:rich@corp.test" }, ""],
  ]);
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: fileForm(buf, "people.xlsx") });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.summary.total, 2);
  assert.equal(r.data.summary.imported, 2);
  const u = await User().findOne({ employeeId: "007" }).lean();
  assert.equal(u.phone, "9876543210");
  assert.equal(u.email, "excel@corp.test");
  assert.equal((await User().findOne({ employeeId: "X-100" }).lean()).email, "rich@corp.test");
});

test("csv: UTF-8 BOM, quoted commas and CRLF are handled", async () => {
  const text = "\uFEFF" + 'Name,Employee ID,Phone,Department\r\n"Doe, Jane",CSV-001,+919444444441,"R&D, Core"\r\n';
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(text) });
  assert.equal(r.data.summary.imported, 1);
  const u = await User().findOne({ employeeId: "CSV-001" }).lean();
  assert.equal(u.name, "Doe, Jane");
  assert.equal(u.department, "R&D, Core");
});

/* ───────── 9. limits ───────── */
test("9. a 1000-row file imports fully; 1001 rows is refused", async () => {
  const rows = Array.from({ length: 1000 }, (_, i) => `Bulk ${i},BULK${String(i).padStart(4, "0")},+9155${String(i).padStart(7, "0")},bulk${i}@big.test,Eng,Dev,,`);
  const t0 = Date.now();
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(csv(...rows)) });
  const ms = Date.now() - t0;
  assert.equal(r.status, 201);
  assert.equal(r.data.summary.imported, 1000);
  assert.equal(r.data.invitations.length, 1000);
  console.log(`      1000-row import took ${ms} ms`);
  assert.ok(ms < 20000);

  const over = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(csv(...rows, row())) });
  assert.equal(over.status, 413);
  assert.match(over.data.error, /limited to 1000/);
});

test("concurrent identical imports never create duplicate accounts", async () => {
  const text = csv(row({ id: "RACE01" }), row({ id: "RACE02" }), row({ id: "RACE03" }));
  const [a, b] = await Promise.all([
    api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(text) }),
    api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(text) }),
  ]);
  assert.equal(a.data.summary.imported + b.data.summary.imported, 3, "each row imported exactly once");
  assert.equal(await User().countDocuments({ employeeId: /^RACE0/ }), 3);
});

/* ───────── 10. existing functionality ───────── */
test("10. edit, deactivate and delete of an imported employee still work", async () => {
  const r = await api("/api/employees/bulk-import", { method: "POST", token: adminToken, form: csvFile(csv(row({ id: "EDIT01" }))) });
  const id = (await User().findOne({ employeeId: "EDIT01" }))._id;
  assert.equal((await api(`/api/employees/${id}`, { method: "PATCH", token: adminToken, json: { designation: "Principal" } })).data.employee.designation, "Principal");
  assert.equal((await api(`/api/employees/${id}`, { method: "PATCH", token: adminToken, json: { active: false } })).data.employee.active, false);
  assert.equal((await api(`/api/employees/${id}`, { method: "DELETE", token: adminToken })).status, 200);
  assert.ok(r.data.invitations.length === 1);
});

test("audit trail records imports without secrets", async () => {
  const logs = await mongoose.connection.db.collection("auditlogs").find({ action: "employees.bulk_import" }).toArray();
  assert.ok(logs.length >= 3);
  const s = JSON.stringify(logs);
  assert.ok(!/accept-invite|inviteTokenHash|passwordHash/.test(s));
  assert.ok(logs[0].actorEmployeeId);
  assert.equal(typeof logs[0].meta.imported, "number");
});

function User() { return UserModel; }
