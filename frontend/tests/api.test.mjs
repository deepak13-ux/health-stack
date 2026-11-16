import assert from "node:assert/strict";
import test from "node:test";

const storage = new Map();
globalThis.sessionStorage = { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k) };
const events = [];
globalThis.window = { dispatchEvent: (e) => events.push(e.type) };

const api = await import("../src/api/index.js");
const BASE = "http://127.0.0.1:8000";
const reply = (data, status = 200) => ({ ok: status < 400, status, headers: { get: () => "application/json" }, json: async () => data });
let calls = [];
const serve = (handler) => { calls = []; globalThis.fetch = async (url, o = {}) => { calls.push({ url, ...o, body: o.body && JSON.parse(o.body) }); return handler(url, o); }; };

test("login stores the token and returns the profile; session uses it", async () => {
  serve(() => reply({ token: "t1", user: { accountId: 16, role: "doctor", userId: 101, name: "Meera Iyer", email: "doctor@demo.com" } }));
  const user = await api.login("doctor@demo.com", "demo123", "doctor");
  assert.deepEqual(calls[0].body, { email: "doctor@demo.com", password: "demo123", role: "doctor" });
  assert.equal(user.name, "Meera Iyer");
  serve(() => reply({ accountId: 16, role: "doctor", userId: 101, name: "Meera Iyer", email: "doctor@demo.com" }));
  assert.equal((await api.getSession()).role, "doctor");
  assert.equal(calls[0].headers.Authorization, "Bearer t1");
});

test("401 clears the session and announces it; network errors are explained", async () => {
  serve(() => reply({ detail: "Session invalid." }, 401));
  await assert.rejects(api.getSession(), /Session invalid/);
  assert.equal(await api.getSession(), null);
  assert.ok(events.includes("careflow:unauthorized"));
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  await assert.rejects(api.listDoctors(), /Can't reach the server/);
});

test("register sends the backend's field names and a 10-digit phone", async () => {
  serve((url) => reply(url.endsWith("/auth/register") ? { token: "t2" } : { accountId: 30, role: "patient", userId: 11, name: "Isha Rao", email: "i@x.in" }));
  const user = await api.registerPatient({ firstName: "Isha", lastName: "Rao", email: " i@x.in ", password: "secret1", phone: "+91 90000-00002", dob: "1991-09-03", gender: "Female" });
  assert.deepEqual(calls[0].body, { name: "Isha Rao", email: "i@x.in", password: "secret1", phone: "9000000002", dob: "1991-09-03", gender: "Female" });
  assert.equal(calls[1].url, `${BASE}/auth/me`);
  assert.equal(user.userId, 11);
});

test("mutations hit the right endpoints with the backend's payloads", async () => {
  serve(() => reply({}));
  await api.bookAppointment({ doctorId: "103", date: "2026-11-16", time: "09:00" });
  await api.rescheduleAppointment(17, { date: "2026-11-17", time: "10:30" });
  await api.cancelAppointment(17);
  await api.completeAppointment(2, { notes: " Rest ", durationDays: "5", items: [{ medicineId: "1", qty: "2", dosage: " After food ", frequency: "Daily" }] });
  await api.recordPayment(7);
  assert.deepEqual(calls.map((c) => [c.method, c.url.replace(BASE, ""), c.body]), [
    ["POST", "/appointments", { doctor_id: 103, app_date: "2026-11-16", app_time: "09:00" }],
    ["PATCH", "/appointments/17/reschedule", { app_date: "2026-11-17", app_time: "10:30" }],
    ["PATCH", "/appointments/17/cancel", undefined],
    ["POST", "/appointments/2/complete", { notes: "Rest", durationDays: 5, items: [{ medicineId: 1, qty: 2, dosage: "After food", frequency: "Daily" }] }],
    ["POST", "/bills/7/payments", undefined],
  ]);
});

test("patient visits are normalised with prescription and bill in paise", async () => {
  serve(() => reply([{
    Appointment_id: 11, Doctor_id: 101, App_date: "2026-11-14", App_time: "09:00", App_status: "Completed",
    First_name: "Meera", Last_name: "Iyer", Dept_name: "General Medicine",
    prescription: { Pres_id: 1, Appointment_id: 11, Pres_date: "2026-11-14", Notes: null, Valid_until: "2026-11-20",
      medicines: [{ Med_id: 1, Med_name: "Paracetamol", Quantity: 10, Dosage: "A", Frequency: "B", Unit_price: 2.0 }] },
    bill: { Bill_id: 1, Appointment_id: 11, Consultation_fee: 200.0, Bill_amount: 230.0, Bill_date: "2026-11-14", Paid_date: null, Payment_status: "Pending", Payment_mode: null },
  }]));
  const [a] = await api.myAppointments();
  assert.equal(a.status, "completed");
  assert.equal(a.doctorName, "Dr. Meera Iyer");
  assert.equal(a.prescription.items[0].unitPricePaise, 200);
  assert.deepEqual([a.bill.totalPaise, a.bill.status], [23000, "unpaid"]);
});

test("pending bills and slots are unwrapped from the backend shapes", async () => {
  serve((url) => reply(url.includes("/slots") ? { doctor_id: 103, date: "2026-11-16", available_slots: ["09:00"] } : [{
    Bill_id: 3, Appointment_id: 13, Consultation_fee: 200, Bill_amount: 300, Bill_date: "2026-11-14", Payment_status: "Pending",
    Patient_id: 3, First_name: "Kabir", Last_name: "Shah", Contact: "9000000003", Pres_id: null, medicines: [],
  }]));
  const [bill] = await api.pendingBills();
  assert.deepEqual([bill.patient.name, bill.prescription, bill.totalPaise], ["Kabir Shah", null, 30000]);
  assert.deepEqual(await api.getSlots(103, "2026-11-16"), ["09:00"]);
  assert.equal(calls.at(-1).url, `${BASE}/doctors/103/slots?date=2026-11-16`);
});

test("logout deletes the server session and always clears the token", async () => {
  sessionStorage.setItem("careflow.api.token", "t3");
  serve(() => ({ ok: true, status: 204, headers: { get: () => null }, json: async () => null }));
  await api.logout();
  assert.deepEqual([calls[0].method, calls[0].body], ["DELETE", { token: "t3" }]);
  assert.equal(sessionStorage.getItem("careflow.api.token"), null);
});
