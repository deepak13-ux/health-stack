import { load, save, uid, ymd } from "./mockDb";

const wait = (v) =>
  new Promise((r) => setTimeout(() => r(structuredClone(v)), 250));
const fail = (m) =>
  new Promise((_, j) => setTimeout(() => j(new Error(m)), 250));
const strip = ({ password, ...u }) => u;
const SESSION = "careflow.session";

// ---------- auth ----------
export const getSession = () => {
  const id = localStorage.getItem(SESSION);
  if (!id) return null;
  const u = load().users.find((x) => x.id === id);
  return u ? strip(u) : null;
};
export async function login(email, password) {
  const u = load().users.find(
    (x) =>
      x.email.toLowerCase() === email.trim().toLowerCase() &&
      x.password === password,
  );
  if (!u) return fail("Email or password is incorrect.");
  if (u.inactive) return fail("This account is deactivated.");
  localStorage.setItem(SESSION, u.id);
  return wait(strip(u));
}
export async function registerPatient(data) {
  const db = load();
  if (
    db.users.some(
      (x) => x.email.toLowerCase() === data.email.trim().toLowerCase(),
    )
  )
    return fail("An account with this email already exists.");
  const u = {
    id: uid("u"),
    role: "patient",
    status: "active",
    mrn: `CF-P-${String(db.users.filter((x) => x.role === "patient").length + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    ...data,
    email: data.email.trim(),
  };
  db.users.push(u);
  save(db);
  localStorage.setItem(SESSION, u.id);
  return wait(strip(u));
}
export const logout = () => localStorage.removeItem(SESSION);

// ---------- catalog ----------
export async function listDepartments() {
  return wait(load().departments);
}
export async function listDoctors() {
  return wait(load().doctors);
}
export async function listMedicines() {
  return wait(load().medicines);
}

// ---------- slots & booking ----------
export function buildSlots(doc, date, appts) {
  const dow = new Date(`${date}T00:00:00`).getDay();
  if (!doc.days.includes(dow)) return [];
  const taken = new Set(
    appts
      .filter(
        (a) =>
          a.doctorId === doc.id && a.date === date && a.status !== "cancelled",
      )
      .map((a) => a.time),
  );
  const toMin = (t) => +t.slice(0, 2) * 60 + +t.slice(3);
  const now = new Date();
  const isToday = date === ymd(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out = [];
  for (let m = toMin(doc.start); m < toMin(doc.end); m += 30) {
    if (m >= 13 * 60 && m < 14 * 60) continue; // lunch
    const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    out.push({
      time,
      available: !taken.has(time) && !(isToday && m <= nowMin),
    });
  }
  return out;
}
export async function getSlots(doctorId, date) {
  const db = load();
  const doc = db.doctors.find((d) => d.id === doctorId);
  return wait(doc ? buildSlots(doc, date, db.appointments) : []);
}
export async function bookAppointment({
  patientId,
  doctorId,
  date,
  time,
  reason,
}) {
  const db = load();
  const doc = db.doctors.find((d) => d.id === doctorId);
  const pat = db.users.find((u) => u.id === patientId);
  if (pat?.status === "archived")
    return fail("This patient record is archived.");
  if (doc.status === "inactive")
    return fail("This doctor is not taking appointments.");
  const slot = buildSlots(doc, date, db.appointments).find(
    (s) => s.time === time,
  );
  if (!slot || !slot.available)
    return fail("This slot was just booked. Choose another time.");
  const clash = db.appointments.some(
    (a) =>
      a.patientId === patientId &&
      a.date === date &&
      a.time === time &&
      a.status !== "cancelled",
  );
  if (clash) return fail("You already have an appointment at this time.");
  const appt = {
    id: uid("apt"),
    patientId,
    doctorId,
    date,
    time,
    reason: reason || "",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  db.appointments.push(appt);
  save(db);
  return wait(appt);
}

const decorate = (db, a) => ({
  ...a,
  doctor: db.doctors.find((d) => d.id === a.doctorId),
  department: db.departments.find(
    (d) => d.id === db.doctors.find((x) => x.id === a.doctorId)?.deptId,
  ),
  patient: db.users.find((u) => u.id === a.patientId),
});
const byWhen = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

export async function listMyAppointments(patientId) {
  const db = load();
  return wait(
    db.appointments
      .filter((a) => a.patientId === patientId)
      .map((a) => decorate(db, a))
      .sort(byWhen),
  );
}
// doctors see only their own; nurses see all
export async function listStaffAppointments(user) {
  const db = load();
  const rows = db.appointments.filter(
    (a) => user.role === "nurse" || a.doctorId === user.doctorId,
  );
  return wait(rows.map((a) => decorate(db, a)).sort(byWhen));
}

const FLOW = {
  scheduled: ["checked_in", "cancelled"],
  checked_in: ["in_consultation", "cancelled"],
  in_consultation: [],
};
export async function transitionAppointment(id, next) {
  const db = load();
  const a = db.appointments.find((x) => x.id === id);
  if (!a || !(FLOW[a.status] || []).includes(next))
    return fail("That status change is not allowed.");
  a.status = next;
  save(db);
  return wait(a);
}

// ---------- the key flow: complete visit -> prescription + bill ----------
export async function completeAppointment(id, { notes, items }) {
  const db = load();
  const a = db.appointments.find((x) => x.id === id);
  if (!a || a.status !== "in_consultation")
    return fail("Start the consultation before completing it.");
  const doc = db.doctors.find((d) => d.id === a.doctorId);
  const meds = items
    .filter((i) => i.medicineId && i.qty > 0)
    .map((i) => {
      const m = db.medicines.find((x) => x.id === i.medicineId);
      return {
        medicineId: m.id,
        name: m.name,
        qty: +i.qty,
        unitPrice: m.price,
        dosage: i.dosage || "",
      };
    });
  const now = new Date().toISOString();
  const rx = {
    id: uid("rx"),
    appointmentId: a.id,
    patientId: a.patientId,
    doctorId: a.doctorId,
    notes,
    items: meds,
    createdAt: now,
  };
  const lines = [
    { description: `Consultation – ${doc.name}`, qty: 1, unitPrice: doc.fee },
    ...meds.map((m) => ({
      description: m.name,
      qty: m.qty,
      unitPrice: m.unitPrice,
    })),
  ];
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const bill = {
    id: uid("bill"),
    number: `CF-B-${String(db.bills.length + 1).padStart(4, "0")}`,
    appointmentId: a.id,
    patientId: a.patientId,
    lines,
    total,
    status: "unpaid",
    createdAt: now,
    paidAt: null,
  };
  a.status = "completed";
  db.prescriptions.push(rx);
  db.bills.push(bill);
  save(db);
  return wait({ rx, bill });
}

// ---------- patient records ----------
export async function listMyPrescriptions(patientId) {
  const db = load();
  return wait(
    db.prescriptions
      .filter((r) => r.patientId === patientId)
      .map((r) => ({
        ...r,
        doctor: db.doctors.find((d) => d.id === r.doctorId),
        appointment: db.appointments.find((a) => a.id === r.appointmentId),
      }))
      .reverse(),
  );
}
export async function listMyBills(patientId) {
  return wait(
    load()
      .bills.filter((b) => b.patientId === patientId && b.state !== "draft")
      .reverse(),
  );
}
export async function payBill(id, method) {
  const db = load();
  const b = db.bills.find((x) => x.id === id);
  if (!b) return fail("Bill not found.");
  b.payments ||= [];
  const bal = b.total - b.payments.reduce((s, p) => s + p.amount, 0);
  if (b.state === "void" || bal <= 0) return fail("This bill has nothing due.");
  b.payments.push({
    id: uid("pay"),
    amount: bal,
    method,
    paidAt: new Date().toISOString(),
    reference: "",
  });
  b.status = "paid";
  b.paidAt = new Date().toISOString();
  save(db);
  return wait(b);
}
export async function cancelMyAppointment(id) {
  return transitionAppointment(id, "cancelled");
}

// ---------- staff ----------
export async function listAdmissions() {
  const db = load();
  return wait(
    db.admissions
      .filter((a) => a.status === "active")
      .map((a) => {
        const bed = db.beds.find((b) => b.id === a.bedId);
        return {
          ...a,
          patient: db.users.find((u) => u.id === a.patientId),
          doctor: db.doctors.find((d) => d.id === a.doctorId),
          bed,
          ward: db.wards.find((w) => w.id === bed?.wardId),
        };
      }),
  );
}
export async function getMyEmployment(userId) {
  const u = load().users.find((x) => x.id === userId);
  return wait({ ...strip(u) });
}
