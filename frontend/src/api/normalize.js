// Map backend rows (database column names) to the UI's data contracts.
import { toPaise } from "../lib/money.js";

const fullName = (first, last) => `${first ?? ""} ${last ?? ""}`.trim();
export const doctorName = (first, last) => `Dr. ${fullName(first, last)}`;
const status = (value) => (value || "").toLowerCase();

export const session = (u) => ({
  accountId: u.accountId,
  role: u.role,
  userId: u.userId,
  name: u.name || u.email || "Signed-in user",
  email: u.email ?? null,
});

export const department = (r) => ({ id: r.Dept_id, name: r.Dept_name });

export const doctor = (r) => ({
  id: r.doctor_id,
  name: doctorName(r.First_name, r.Last_name),
  department: r.Dept_name,
  departmentId: r.Dept_id ?? null,
  feePaise: toPaise(r.Consultation_fee),
  licenseNo: r.License_no ?? null,
});

export const medicine = (r) => ({ id: r.Med_id, name: r.Med_name, pricePaise: toPaise(r.Price) });

export const prescriptionItem = (m) => ({
  medicineId: m.Med_id,
  name: m.Med_name,
  qty: m.Quantity,
  dosage: m.Dosage,
  frequency: m.Frequency,
  unitPricePaise: toPaise(m.Unit_price),
});

export const prescription = (p) => p && ({
  id: p.Pres_id,
  appointmentId: p.Appointment_id,
  date: p.Pres_date,
  notes: p.Notes || "",
  validUntil: p.Valid_until,
  items: (p.medicines || []).map(prescriptionItem),
});

export const bill = (b) => b && ({
  id: b.Bill_id,
  appointmentId: b.Appointment_id,
  consultationFeePaise: toPaise(b.Consultation_fee),
  totalPaise: toPaise(b.Bill_amount),
  date: b.Bill_date,
  paidDate: b.Paid_date ?? null,
  status: b.Payment_status === "Paid" ? "paid" : "unpaid",
  method: b.Payment_mode ?? null,
});

// Rows from /patients/me/appointments and the doctor's appointment history.
export const appointment = (r) => ({
  id: r.Appointment_id,
  doctorId: r.Doctor_id,
  doctorName: r.First_name !== undefined ? doctorName(r.First_name, r.Last_name) : null,
  department: r.Dept_name ?? null,
  date: r.App_date,
  time: r.App_time,
  status: status(r.App_status),
  prescription: prescription(r.prescription ?? null),
  bill: bill(r.bill ?? null),
});

// /patients/me already uses camelCase.
export const patientProfile = (p) => ({
  id: p.id,
  name: fullName(p.firstName, p.lastName),
  email: p.email,
  phone: p.phone,
  gender: p.gender,
  dob: p.dob,
  street: p.street,
  city: p.city,
  state: p.state,
  history: p.history,
});

export const patientRow = (p) => ({
  id: p.Patient_id,
  name: fullName(p.First_name, p.Last_name),
  gender: p.Gender,
  dob: p.DOB,
  phone: p.Contact,
  email: p.Mail ?? null,
  city: p.City ?? null,
  state: p.State ?? null,
  history: p.History ?? null,
});

// /doctors/me/appointments: today's scheduled visits with patient columns inline.
export const queueItem = (r) => ({
  id: r.Appointment_id,
  date: r.App_date,
  time: r.App_time,
  status: status(r.App_status),
  patient: patientRow(r),
});

// /appointments/{id}; doctors additionally receive patient and history.
export const appointmentDetail = (r) => ({
  ...appointment(r),
  patientId: r.Patient_id,
  patient: r.patient ? patientRow(r.patient) : null,
  history: (r.history || []).map(appointment),
});

// /reception/pending-bills rows: bill + patient + optional prescription.
export const pendingBill = (r) => ({
  ...bill(r),
  patient: { id: r.Patient_id, name: fullName(r.First_name, r.Last_name), phone: r.Contact },
  prescription: r.Pres_id == null ? null : prescription({
    Pres_id: r.Pres_id,
    Appointment_id: r.Appointment_id,
    Pres_date: r.Pres_date,
    Notes: r.Notes,
    Valid_until: r.Valid_until,
    medicines: r.medicines,
  }),
});
