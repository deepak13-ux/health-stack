// Every backend endpoint the frontend uses, with responses normalised to UI contracts.
import { clearToken, getToken, request, setToken } from "./client.js";
import * as N from "./normalize.js";

const id = encodeURIComponent;

// --- Auth (backend/auth.py)
export async function getSession() {
  if (!getToken()) return null;
  return N.session(await request("/auth/me"));
}
export async function login(email, password, role) {
  const result = await request("/auth/login", { method: "POST", body: { email, password, role } });
  setToken(result.token);
  return N.session(result.user);
}
export async function registerPatient({ firstName, lastName, email, password, phone, dob, gender }) {
  const result = await request("/auth/register", {
    method: "POST",
    body: {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password,
      phone: phone.replace(/[\s-]/g, "").replace(/^\+91/, ""),
      dob,
      gender,
    },
  });
  setToken(result.token);
  return getSession();
}
export async function logout() {
  const token = getToken();
  try {
    if (token) await request("/auth/session", { method: "DELETE", body: { token } });
  } finally {
    clearToken();
  }
}

// --- Doctors and departments (backend/doctor.py)
export const listDepartments = async () => (await request("/departments")).map(N.department);
export const listDoctors = async () => (await request("/doctors")).map(N.doctor);
export const getDoctor = async (doctorId) => N.doctor(await request(`/doctors/${id(doctorId)}`));
export const getSlots = async (doctorId, date) =>
  (await request(`/doctors/${id(doctorId)}/slots?${new URLSearchParams({ date })}`)).available_slots;
export const listMedicines = async () => (await request("/medicines")).map(N.medicine);
export const doctorQueue = async () => (await request("/doctors/me/appointments")).map(N.queueItem);

// --- Patient (backend/patient.py, backend/appointment.py)
export const myProfile = async () => N.patientProfile(await request("/patients/me"));
export const myDashboard = () => request("/patients/me/dashboard");
export const myAppointments = async () => (await request("/patients/me/appointments")).map(N.appointment);

// --- Appointments (backend/appointment.py)
export const bookAppointment = ({ doctorId, date, time }) =>
  request("/appointments", { method: "POST", body: { doctor_id: Number(doctorId), app_date: date, app_time: time } });
export const getAppointment = async (appointmentId) =>
  N.appointmentDetail(await request(`/appointments/${id(appointmentId)}`));
export const cancelAppointment = (appointmentId) =>
  request(`/appointments/${id(appointmentId)}/cancel`, { method: "PATCH" });
export const rescheduleAppointment = (appointmentId, { date, time }) =>
  request(`/appointments/${id(appointmentId)}/reschedule`, { method: "PATCH", body: { app_date: date, app_time: time } });
export const completeAppointment = (appointmentId, { notes, durationDays, items }) =>
  request(`/appointments/${id(appointmentId)}/complete`, {
    method: "POST",
    body: {
      notes: notes.trim(),
      durationDays: Number(durationDays),
      items: items.map((item) => ({
        medicineId: Number(item.medicineId),
        qty: Number(item.qty),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
      })),
    },
  });

// --- Billing desk (backend/reception.py)
export const pendingBills = async () => (await request("/reception/pending-bills")).map(N.pendingBill);
export const recordPayment = (billId) => request(`/bills/${id(billId)}/payments`, { method: "POST" });
