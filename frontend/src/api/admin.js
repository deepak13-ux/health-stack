import { load, save, resetDb, uid, ymd, fixBill } from "./mockDb";
import { buildSlots } from "./api";

const requireRecord = (rows, id) => {
  const row = rows.find((x) => x.id === id);
  if (!row) throw new Error("Record not found.");
  return row;
};
const mutate = async (fn) => {
  const db = load();
  const result = fn(db);
  save(db);
  return structuredClone(result);
};
const uniqueEmail = (db, email, id) => {
  if (
    !email ||
    db.users.some(
      (u) =>
        u.id !== id && u.email.toLowerCase() === email.trim().toLowerCase(),
    )
  )
    throw new Error("Enter a unique email address.");
};
const publicUser = ({ password, ...user }) => {
  void password;
  return user;
};

export async function getSnapshot() {
  const db = load();
  db.users = db.users.map(publicUser);
  db.bills.forEach(fixBill);
  return structuredClone(db);
}

export const savePatient = (data) =>
  mutate((db) => {
    uniqueEmail(db, data.email, data.id);
    const patient = data.id
      ? requireRecord(db.users, data.id)
      : {
          id: uid("u"),
          role: "patient",
          password: "demo123",
          status: "active",
          mrn: `CF-P-${String(db.users.filter((u) => u.role === "patient").length + 1).padStart(4, "0")}`,
          createdAt: new Date().toISOString(),
        };
    const { id, role, password, ...fields } = data;
    void id;
    void role;
    void password;
    Object.assign(patient, fields, { email: data.email.trim() });
    if (!data.id) db.users.push(patient);
    return publicUser(patient);
  });
export const setPatientStatus = (id, status) =>
  mutate((db) => {
    if (!["active", "archived"].includes(status))
      throw new Error("Invalid patient status.");
    const patient = requireRecord(db.users, id);
    patient.status = status;
    return publicUser(patient);
  });

export const saveEmployee = (data) =>
  mutate((db) => {
    uniqueEmail(db, data.email, data.id);
    const user = data.id
      ? requireRecord(db.users, data.id)
      : {
          id: uid("u"),
          role: data.role,
          password: "staff123",
        };
    Object.assign(user, {
      name: data.name,
      email: data.email.trim(),
      inactive: !!data.inactive,
    });
    user.employment = {
      ...user.employment,
      phone: data.phone,
      shift: data.shift,
      joinedOn: data.joinedOn,
      salary: +data.salary,
      workingDays: +data.workingDays,
      daysWorked: +data.daysWorked,
    };
    if (!data.id) db.users.push(user);
    return publicUser(user);
  });
export const saveDoctor = (data) =>
  mutate((db) => {
    const doctor = data.id
      ? requireRecord(db.doctors, data.id)
      : { id: uid("doc"), userId: uid("u") };
    let user = db.users.find((u) => u.id === doctor.userId);
    if (!user) {
      uniqueEmail(db, data.email);
      user = {
        id: doctor.userId,
        role: "doctor",
        doctorId: doctor.id,
        email: data.email.trim(),
        password: "staff123",
        employment: {},
      };
      db.users.push(user);
    }
    const { id, email, ...fields } = data;
    void id;
    void email;
    Object.assign(doctor, fields);
    Object.assign(user, {
      name: doctor.name,
      inactive: doctor.status === "inactive",
    });
    user.employment = { ...user.employment, phone: doctor.phone };
    if (!data.id) db.doctors.push(doctor);
    return doctor;
  });
export const updateProfile = (id, data) =>
  mutate((db) => {
    const user = requireRecord(db.users, id);
    user.name = data.name;
    if (user.employment) user.employment.phone = data.phone;
    else user.phone = data.phone;
    return publicUser(user);
  });
export const saveSettings = (data) =>
  mutate((db) => (db.settings = { ...db.settings, ...data }));
export async function resetDemo() {
  resetDb();
  localStorage.removeItem("careflow.session");
  return getSnapshot();
}

export async function getSlotsFor(doctorId, date, excludeId) {
  const db = load();
  return buildSlots(
    requireRecord(db.doctors, doctorId),
    date,
    db.appointments.filter((a) => a.id !== excludeId),
  );
}
const editableAppointment = (db, id) => {
  const a = requireRecord(db.appointments, id);
  if (!["scheduled", "checked_in"].includes(a.status))
    throw new Error("This appointment can no longer be changed.");
  return a;
};
export const rescheduleAppointment = (id, date, time) =>
  mutate((db) => {
    const a = editableAppointment(db, id);
    const doctor = requireRecord(db.doctors, a.doctorId);
    if (
      doctor.status === "inactive" ||
      !buildSlots(
        doctor,
        date,
        db.appointments.filter((x) => x.id !== id),
      ).some((s) => s.time === time && s.available)
    )
      throw new Error("This slot is unavailable.");
    if (
      db.appointments.some(
        (x) =>
          x.id !== id &&
          x.patientId === a.patientId &&
          x.date === date &&
          x.time === time &&
          x.status !== "cancelled",
      )
    )
      throw new Error("The patient already has an appointment at this time.");
    Object.assign(a, { date, time, status: "scheduled" });
    return a;
  });
export const cancelAppointment = (id, reason) =>
  mutate((db) => {
    const a = editableAppointment(db, id);
    Object.assign(a, { status: "cancelled", cancelReason: reason });
    return a;
  });
export const markNoShow = (id) =>
  mutate((db) => {
    const a = editableAppointment(db, id);
    a.status = "no_show";
    return a;
  });

export const admitPatient = (data) =>
  mutate((db) => {
    const patient = requireRecord(db.users, data.patientId);
    requireRecord(db.doctors, data.doctorId);
    const bed = requireRecord(db.beds, data.bedId);
    if (
      patient.role !== "patient" ||
      patient.status === "archived" ||
      db.admissions.some(
        (a) => a.patientId === patient.id && a.status === "active",
      )
    )
      throw new Error("This patient cannot be admitted.");
    if (bed.status !== "available") throw new Error("This bed is unavailable.");
    const a = {
      ...data,
      id: uid("adm"),
      admittedAt: new Date(data.admittedAt).toISOString(),
      status: "active",
      dischargedAt: null,
      dischargeSummary: "",
      transfers: [],
    };
    bed.status = "occupied";
    db.admissions.push(a);
    return a;
  });
export const transferBed = (id, bedId, reason) =>
  mutate((db) => {
    const a = requireRecord(db.admissions, id);
    const bed = requireRecord(db.beds, bedId);
    if (a.status !== "active" || bed.status !== "available")
      throw new Error("This bed transfer is unavailable.");
    a.transfers.push({
      fromBedId: a.bedId,
      toBedId: bedId,
      reason,
      at: new Date().toISOString(),
    });
    requireRecord(db.beds, a.bedId).status = "available";
    bed.status = "occupied";
    a.bedId = bedId;
    return a;
  });
export const dischargePatient = (id, { dischargedAt, summary }) =>
  mutate((db) => {
    const a = requireRecord(db.admissions, id);
    if (
      a.status !== "active" ||
      new Date(dischargedAt) < new Date(a.admittedAt)
    )
      throw new Error("Invalid discharge time or admission status.");
    Object.assign(a, {
      status: "discharged",
      dischargedAt: new Date(dischargedAt).toISOString(),
      dischargeSummary: summary,
    });
    requireRecord(db.beds, a.bedId).status = "available";
    return a;
  });
export const setBedMaintenance = (id, maintenance, reason = "") =>
  mutate((db) => {
    const bed = requireRecord(db.beds, id);
    if (bed.status === "occupied")
      throw new Error("An occupied bed cannot be changed.");
    Object.assign(bed, {
      status: maintenance ? "maintenance" : "available",
      maintenanceReason: maintenance ? reason : "",
    });
    return bed;
  });

const invoice = (db, id) => fixBill(requireRecord(db.bills, id));
const paid = (bill) => bill.payments.reduce((sum, p) => sum + p.amount, 0);
export const saveInvoice = (data) =>
  mutate((db) => {
    const b = data.id
      ? invoice(db, data.id)
      : {
          id: uid("bill"),
          number: `${db.settings.invoicePrefix}-${String(db.bills.length + 1).padStart(4, "0")}`,
          createdAt: new Date().toISOString(),
          payments: [],
          state: "draft",
        };
    if (b.state !== "draft")
      throw new Error("Only draft invoices can be edited.");
    requireRecord(db.users, data.patientId);
    const total =
      data.lines.reduce((sum, l) => sum + Math.round(l.qty * l.unitPrice), 0) -
      (data.discount || 0);
    if (
      !data.lines.length ||
      data.lines.some(
        (l) => !l.description.trim() || !(l.qty > 0) || !(l.unitPrice >= 0),
      ) ||
      !Number.isFinite(total) ||
      total < 0 ||
      data.discount < 0 ||
      data.dueDate < data.issueDate
    )
      throw new Error("Check the invoice items, discount and dates.");
    const { id, issue, ...fields } = data;
    void id;
    Object.assign(b, fields, {
      total,
      state: issue ? "issued" : "draft",
      status: total === 0 ? "paid" : "unpaid",
    });
    if (!data.id) db.bills.push(b);
    return b;
  });
export const issueInvoice = (id) =>
  mutate((db) => {
    const b = invoice(db, id);
    if (b.state !== "draft")
      throw new Error("Only draft invoices can be issued.");
    b.state = "issued";
    return b;
  });
export const recordPayment = (id, data) =>
  mutate((db) => {
    const b = invoice(db, id);
    if (
      data.idempotencyKey &&
      b.payments.some((p) => p.idempotencyKey === data.idempotencyKey)
    )
      return b;
    if (
      b.state !== "issued" ||
      !Number.isFinite(data.amount) ||
      data.amount <= 0 ||
      data.amount > b.total - paid(b)
    )
      throw new Error("Enter a payment within the outstanding balance.");
    b.payments.push({
      ...data,
      id: uid("pay"),
      paidAt: new Date(data.paidAt).toISOString(),
    });
    b.status = paid(b) >= b.total ? "paid" : "partial";
    if (b.status === "paid") b.paidAt = b.payments.at(-1).paidAt;
    return b;
  });
export const voidInvoice = (id, reason) =>
  mutate((db) => {
    const b = invoice(db, id);
    if (b.state !== "issued" || paid(b) > 0 || !reason?.trim())
      throw new Error(
        "Only unpaid issued invoices can be voided with a reason.",
      );
    Object.assign(b, { state: "void", voidReason: reason });
    return b;
  });
export const deleteDraft = (id) =>
  mutate((db) => {
    if (invoice(db, id).state !== "draft")
      throw new Error("Only drafts can be deleted.");
    db.bills = db.bills.filter((b) => b.id !== id);
    return true;
  });
