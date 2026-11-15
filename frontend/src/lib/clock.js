// One shared hospital clock. All "today" logic uses Asia/Kolkata, never the browser's zone.
export const HOSPITAL_TZ = "Asia/Kolkata";

// Mirrors MAX_BOOKING_DAYS in backend/server.py: bookings from today through today + 3.
export const BOOKING_WINDOW_DAYS = 3;

export function hospitalToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: HOSPITAL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// Hospital-local "YYYY-MM-DDTHH:mm", comparable with stamp(appointment).
export function hospitalNowStamp(now = new Date()) {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: HOSPITAL_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
  return `${hospitalToday(now)}T${time}`;
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function bookingDates(today = hospitalToday()) {
  return Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, i) => addDays(today, i));
}

const asUtc = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function fmtDate(iso, { weekday = false, year = true } = {}) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    ...(weekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
  }).format(asUtc(iso));
}

// "Today", "Tomorrow" or "Tue, 17 Nov" relative to the hospital date.
export function relativeDay(iso, today = hospitalToday()) {
  if (iso === today) return "Today";
  if (iso === addDays(today, 1)) return "Tomorrow";
  if (iso === addDays(today, -1)) return "Yesterday";
  return fmtDate(iso, { weekday: true, year: false });
}

export function ageFrom(dob, today = hospitalToday()) {
  if (!dob) return null;
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

// Sort key for a date + HH:mm pair.
export const stamp = (a) => `${a.date}T${a.time || "00:00"}`;
