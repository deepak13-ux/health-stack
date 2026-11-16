// Frontend mirrors of the server's rules. The server re-checks every one of them;
// these only decide which actions to offer and how to explain them.

// backend/appointment.py complete_appointment bills a fixed ₹200 consultation fee
// (the billing trigger enforces the same value).
export const CONSULTATION_FEE_PAISE = 20000;

export const displayId = (prefix, id) => `CF-${prefix}-${String(id).padStart(4, "0")}`;

export function initials(name = "") {
  const parts = name.replace(/^Dr\.\s*/, "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// Patients may cancel or reschedule only scheduled visits after today (no same-day changes).
export const canPatientChange = (appointment, today) =>
  appointment.status === "scheduled" && appointment.date > today;

// Doctors complete scheduled visits dated today or earlier.
export const canDoctorComplete = (appointment, today) =>
  appointment.status === "scheduled" && appointment.date <= today;

export const isRunning = (prescription, today) => prescription.validUntil >= today;

export const billBalance = (bill) => (bill.status === "paid" ? 0 : bill.totalPaise);
export const billPaid = (bill) => (bill.status === "paid" ? bill.totalPaise : 0);

export function billLines(bill, prescription) {
  return [
    { description: "Consultation fee", qty: 1, unitPricePaise: bill.consultationFeePaise },
    ...(prescription?.items || []).map((item) => ({
      description: item.name,
      qty: item.qty,
      unitPricePaise: item.unitPricePaise,
    })),
  ];
}

export function estimateVisitTotal(items, medicinesById) {
  return items.reduce((sum, item) => {
    const medicine = medicinesById.get(Number(item.medicineId));
    const qty = Number(item.qty);
    return medicine && Number.isInteger(qty) && qty > 0 ? sum + medicine.pricePaise * qty : sum;
  }, CONSULTATION_FEE_PAISE);
}

// Validates the doctor's "complete visit" form. Returns { field: message }.
export function validateVisit({ durationDays, items }) {
  const errors = {};
  const days = Number(durationDays);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    errors.durationDays = "Enter a whole number of days from 1 to 365.";
  }
  const seen = new Set();
  items.forEach((item, i) => {
    if (!item.medicineId) errors[`items.${i}.medicineId`] = "Select a medicine.";
    else if (seen.has(String(item.medicineId))) errors[`items.${i}.medicineId`] = "Add each medicine only once.";
    seen.add(String(item.medicineId));
    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) errors[`items.${i}.qty`] = "Enter a whole quantity from 1 to 1000.";
    if (!item.dosage.trim()) errors[`items.${i}.dosage`] = "Enter the dosage instructions.";
    else if (item.dosage.trim().length > 50) errors[`items.${i}.dosage`] = "Use 50 characters or fewer.";
    if (!item.frequency.trim()) errors[`items.${i}.frequency`] = "Enter how often to take it.";
    else if (item.frequency.trim().length > 50) errors[`items.${i}.frequency`] = "Use 50 characters or fewer.";
  });
  return errors;
}

export function validateRegistration(f, today) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = "Enter your first name.";
  else if (/\s/.test(f.firstName.trim())) e.firstName = "Use one word. Put any other names in Last name.";
  if (!f.lastName.trim()) e.lastName = "Enter your last name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email address.";
  if (f.password.length < 6) e.password = "Use at least 6 characters.";
  if (!/^(\+91)?\d{10}$/.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid phone number.";
  if (!f.dob) e.dob = "Enter your date of birth.";
  else if (f.dob > today) e.dob = "Date of birth can't be in the future.";
  if (!f.gender) e.gender = "Select a gender.";
  return e;
}
