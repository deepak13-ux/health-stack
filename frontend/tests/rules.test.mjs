import assert from "node:assert/strict";
import test from "node:test";
import { addDays, ageFrom, bookingDates, hospitalNowStamp, hospitalToday, relativeDay } from "../src/lib/clock.js";
import { inr, toPaise } from "../src/lib/money.js";
import {
  billBalance, billLines, canDoctorComplete, canPatientChange, displayId,
  estimateVisitTotal, initials, isRunning, validateRegistration, validateVisit,
} from "../src/lib/rules.js";

test("hospital date uses Asia/Kolkata, not the machine zone", () => {
  // 20:00 UTC is already the next day in Kolkata (UTC+05:30).
  assert.equal(hospitalToday(new Date("2026-11-15T20:00:00Z")), "2026-11-16");
  assert.equal(hospitalToday(new Date("2026-11-15T18:00:00Z")), "2026-11-15");
  assert.equal(hospitalNowStamp(new Date("2026-11-15T18:40:00Z")), "2026-11-16T00:10");
});

test("booking window is today plus the server's 3 days, across month ends", () => {
  assert.deepEqual(bookingDates("2026-11-29"), ["2026-11-29", "2026-11-30", "2026-12-01", "2026-12-02"]);
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(relativeDay("2026-11-16", "2026-11-15"), "Tomorrow");
});

test("age counts completed years only", () => {
  assert.equal(ageFrom("2000-11-16", "2026-11-15"), 25);
  assert.equal(ageFrom("2000-11-15", "2026-11-15"), 26);
});

test("money is held in paise without float drift", () => {
  assert.equal(toPaise(230.1), 23010);
  assert.equal(toPaise("0.29"), 29);
  assert.equal(toPaise(null), 0);
  assert.equal(inr(24400), "₹244");
  assert.equal(inr(150050), "₹1,500.50");
});

test("patients can change only scheduled visits after today", () => {
  const today = "2026-11-15";
  assert.equal(canPatientChange({ status: "scheduled", date: "2026-11-16" }, today), true);
  assert.equal(canPatientChange({ status: "scheduled", date: today }, today), false);
  assert.equal(canPatientChange({ status: "completed", date: "2026-11-16" }, today), false);
  assert.equal(canPatientChange({ status: "cancelled", date: "2026-11-17" }, today), false);
});

test("doctors complete scheduled visits on or before today", () => {
  const today = "2026-11-15";
  assert.equal(canDoctorComplete({ status: "scheduled", date: today }, today), true);
  assert.equal(canDoctorComplete({ status: "scheduled", date: "2026-11-16" }, today), false);
  assert.equal(canDoctorComplete({ status: "completed", date: today }, today), false);
});

test("bill balance, running prescriptions and bill lines", () => {
  assert.equal(billBalance({ status: "unpaid", totalPaise: 23000 }), 23000);
  assert.equal(billBalance({ status: "paid", totalPaise: 23000 }), 0);
  assert.equal(isRunning({ validUntil: "2026-11-15" }, "2026-11-15"), true);
  assert.equal(isRunning({ validUntil: "2026-11-14" }, "2026-11-15"), false);
  const lines = billLines({ consultationFeePaise: 20000 }, { items: [{ name: "Calcium", qty: 4, unitPricePaise: 1000 }] });
  assert.deepEqual(lines.map((l) => l.qty * l.unitPricePaise), [20000, 4000]);
});

test("visit estimate = ₹200 consultation + valid medicine lines", () => {
  const meds = new Map([[1, { pricePaise: 200 }], [3, { pricePaise: 1000 }]]);
  assert.equal(estimateVisitTotal([{ medicineId: "1", qty: "2" }, { medicineId: "3", qty: "4" }], meds), 24400);
  assert.equal(estimateVisitTotal([{ medicineId: "1", qty: "-1" }], meds), 20000);
});

test("visit form rejects duplicates, bad quantities and long text", () => {
  const item = (o) => ({ medicineId: "1", qty: "1", dosage: "After food", frequency: "Daily", ...o });
  assert.deepEqual(validateVisit({ durationDays: "7", items: [item()] }), {});
  const errors = validateVisit({ durationDays: "0", items: [item(), item({ qty: "1.5", dosage: "", frequency: "x".repeat(51) })] });
  assert.ok(errors.durationDays);
  assert.equal(errors["items.1.medicineId"], "Add each medicine only once.");
  assert.ok(errors["items.1.qty"] && errors["items.1.dosage"] && errors["items.1.frequency"]);
});

test("registration needs a one-word first name, valid phone and past DOB", () => {
  const ok = { firstName: "Isha", lastName: "Rao", email: "isha@example.com", password: "secret1", phone: "+91 90000 00002", dob: "1991-09-03", gender: "Female" };
  assert.deepEqual(validateRegistration(ok, "2026-11-15"), {});
  const bad = validateRegistration({ ...ok, firstName: "Isha Mary", phone: "12345", dob: "2026-11-16" }, "2026-11-15");
  assert.deepEqual(Object.keys(bad).sort(), ["dob", "firstName", "phone"]);
});

test("display helpers", () => {
  assert.equal(displayId("B", 7), "CF-B-0007");
  assert.equal(initials("Dr. Meera Iyer"), "MI");
});
