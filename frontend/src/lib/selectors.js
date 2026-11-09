import { ymd, fixBill } from "../api/mockDb";

export const rangeDays = (from, to) => {
  const out = [];
  const d = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (d <= end) {
    out.push(ymd(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
};
export const ageOf = (dob) => {
  const d = new Date(dob),
    n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
};
export const fmtDT = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export const toLocalInput = (d = new Date()) =>
  `${ymd(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
export const stayDays = (from, to = new Date()) =>
  Math.max(1, Math.ceil((new Date(to) - new Date(from)) / 36e5 / 24));
export const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));

// ----- billing -----
export const bills = (db) =>
  db.bills.map((b) =>
    fixBill({ ...b, payments: b.payments ? [...b.payments] : undefined }),
  );
export const sumPaid = (b) => b.payments.reduce((s, p) => s + p.amount, 0);
export const balanceOf = (b) =>
  b.state === "issued" ? b.total - sumPaid(b) : 0;
export const billStatus = (b, today = ymd()) =>
  b.state === "void"
    ? "void"
    : b.state === "draft"
      ? "draft"
      : balanceOf(b) <= 0
        ? "paid"
        : b.dueDate < today
          ? "overdue"
          : sumPaid(b) > 0
            ? "partial"
            : "unpaid";
export const payDate = (p) => ymd(new Date(p.paidAt));
export const allPayments = (db) =>
  bills(db)
    .filter((b) => b.state !== "void")
    .flatMap((b) =>
      b.payments.map((p) => ({
        ...p,
        billId: b.id,
        number: b.number,
        patientId: b.patientId,
      })),
    );

// ----- dashboard + reports -----
export function kpis(db, today = ymd()) {
  const t = db.appointments.filter(
    (a) => a.date === today && a.status !== "cancelled",
  );
  return {
    todayCount: t.length,
    checkedIn: t.filter((a) => a.status === "checked_in").length,
    patients: db.users.filter(
      (u) => u.role === "patient" && u.status !== "archived",
    ).length,
    bedsAvail: db.beds.filter((b) => b.status === "available").length,
    occ: db.beds.filter((b) => b.status === "occupied").length,
    totalBeds: db.beds.length,
    collectedToday: allPayments(db)
      .filter((p) => payDate(p) === today)
      .reduce((s, p) => s + p.amount, 0),
  };
}
export const apptByDay = (db, days) =>
  days.map((d) => ({
    label: d,
    value: db.appointments.filter(
      (a) => a.date === d && a.status !== "cancelled",
    ).length,
  }));
export function apptSummary(db, days) {
  const s = new Set(days);
  const r = db.appointments.filter((a) => s.has(a.date));
  const c = (k) => r.filter((a) => a.status === k).length;
  return {
    total: r.length,
    completed: c("completed"),
    noShow: c("no_show"),
    cancelled: c("cancelled"),
  };
}
export function deptBreakdown(db, days) {
  const s = new Set(days);
  const D = byId(db.doctors);
  return db.departments.map((d) => {
    const r = db.appointments.filter(
      (a) => s.has(a.date) && D[a.doctorId]?.deptId === d.id,
    );
    const c = (k) => r.filter((a) => a.status === k).length;
    return {
      department: d.name,
      total: r.length,
      completed: c("completed"),
      noShow: c("no_show"),
      cancelled: c("cancelled"),
    };
  });
}
export const collectionsByDay = (db, days) => {
  const ps = allPayments(db);
  return days.map((d) => ({
    label: d,
    value: ps.filter((p) => payDate(p) === d).reduce((s, p) => s + p.amount, 0),
  }));
};
export function methodBreakdown(db, days) {
  const s = new Set(days);
  const ps = allPayments(db).filter((p) => s.has(payDate(p)));
  return ["Cash", "Card", "UPI"].map((m) => ({
    method: m,
    count: ps.filter((p) => p.method === m).length,
    amount: ps.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0),
  }));
}
export const occupancyByWard = (db) =>
  db.wards.map((w) => {
    const b = db.beds.filter((x) => x.wardId === w.id);
    const c = (k) => b.filter((x) => x.status === k).length;
    return {
      ward: w.name,
      total: b.length,
      occupied: c("occupied"),
      available: c("available"),
      maintenance: c("maintenance"),
    };
  });
