const KEY = "careflow.demo.v2";

export const ymd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const uid = (p) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
export const addDays = (n, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

// Older bills (auto-created at visit completion) lack some fields; normalise on read/write.
export function fixBill(b) {
  b.state ||= "issued";
  b.discount ||= 0;
  b.payments ||= [];
  b.issueDate ||= ymd(new Date(b.createdAt));
  b.dueDate ||= addDays(7, new Date(b.createdAt));
  return b;
}

function seed() {
  const ago = (days) => new Date(Date.now() - days * 864e5).toISOString();
  const emp = (salary, daysWorked, joinedOn, phone, shift) => ({
    salary,
    daysWorked,
    workingDays: 26,
    joinedOn,
    phone,
    shift,
  });
  const pat = (id, name, email, phone, dob, gender, n) => ({
    id,
    role: "patient",
    name,
    email,
    password: "demo123",
    phone,
    dob,
    gender,
    bloodGroup: "Unknown",
    address: "",
    allergies: "",
    emergency: { name: "", relationship: "", phone: "" },
    status: "active",
    mrn: `CF-P-${String(n).padStart(4, "0")}`,
    createdAt: ago(30 - n),
  });
  const staff = (id, role, name, email, employment, extra = {}) => ({
    id,
    role,
    name,
    email,
    password: "demo123",
    inactive: false,
    employment,
    ...extra,
  });

  const wards = [
    {
      id: "w1",
      name: "General Ward",
      type: "General",
      prefix: "G",
      rate: 1500,
    },
    {
      id: "w2",
      name: "Cardiac Ward",
      type: "Cardiac",
      prefix: "C",
      rate: 2500,
    },
    {
      id: "w3",
      name: "Ortho Ward",
      type: "Orthopedic",
      prefix: "O",
      rate: 2000,
    },
  ];
  const beds = wards.flatMap((w) =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `${w.id}-b${i + 1}`,
      wardId: w.id,
      code: `${w.prefix}-0${i + 1}`,
      rate: w.rate,
      status: "available",
      maintenanceReason: "",
    })),
  );
  const admissions = [
    {
      id: "adm1",
      patientId: "u_pat2",
      doctorId: "doc1",
      bedId: "w1-b3",
      admittedAt: ago(2),
      dischargedAt: null,
      reason: "Dengue observation",
      dischargeSummary: "",
      status: "active",
      transfers: [],
    },
    {
      id: "adm2",
      patientId: "u_pat3",
      doctorId: "doc2",
      bedId: "w2-b1",
      admittedAt: ago(1),
      dischargedAt: null,
      reason: "Chest pain monitoring",
      dischargeSummary: "",
      status: "active",
      transfers: [],
    },
    {
      id: "adm3",
      patientId: "u_pat4",
      doctorId: "doc3",
      bedId: "w3-b5",
      admittedAt: ago(0.2),
      dischargedAt: null,
      reason: "Post-op recovery",
      dischargeSummary: "",
      status: "active",
      transfers: [],
    },
  ];
  admissions.forEach((a) => {
    beds.find((b) => b.id === a.bedId).status = "occupied";
  });
  Object.assign(
    beds.find((b) => b.id === "w1-b6"),
    { status: "maintenance", maintenanceReason: "Deep cleaning" },
  );

  const doc = (id, name, deptId, specialty, fee, days, start, end, phone) => ({
    id,
    userId: `u_${id}`,
    name,
    deptId,
    specialty,
    qualification: "MBBS, MD",
    phone,
    fee,
    days,
    start,
    end,
    status: "active",
  });

  return {
    settings: {
      name: "Careflow Community Hospital",
      address: "12 Lake Road, Indore",
      phone: "0731-0000000",
      invoicePrefix: "CF-B",
      defaultFee: 500,
    },
    departments: [
      { id: "d1", name: "General Medicine" },
      { id: "d2", name: "Cardiology" },
      { id: "d3", name: "Orthopedics" },
      { id: "d4", name: "Pediatrics" },
    ],
    doctors: [
      doc(
        "doc1",
        "Dr. Meera Iyer",
        "d1",
        "Family physician",
        500,
        [1, 2, 3, 4, 5, 6],
        "09:00",
        "17:00",
        "9000000011",
      ),
      doc(
        "doc2",
        "Dr. Arjun Nair",
        "d2",
        "Cardiologist",
        900,
        [1, 3, 5],
        "10:00",
        "16:00",
        "9000000012",
      ),
      doc(
        "doc3",
        "Dr. Sana Qureshi",
        "d3",
        "Orthopedic surgeon",
        800,
        [2, 4, 6],
        "09:00",
        "15:00",
        "9000000013",
      ),
      doc(
        "doc4",
        "Dr. Vikram Joshi",
        "d4",
        "Pediatrician",
        600,
        [1, 2, 3, 4, 5],
        "09:00",
        "17:00",
        "9000000014",
      ),
    ],
    medicines: [
      { id: "m1", name: "Paracetamol 500mg", price: 2 },
      { id: "m2", name: "Amoxicillin 500mg", price: 12 },
      { id: "m3", name: "Cetirizine 10mg", price: 3 },
      { id: "m4", name: "Pantoprazole 40mg", price: 9 },
      { id: "m5", name: "Atorvastatin 10mg", price: 8 },
      { id: "m6", name: "Ibuprofen 400mg", price: 4 },
      { id: "m7", name: "ORS sachet", price: 15 },
    ],
    wards,
    beds,
    admissions,
    users: [
      pat(
        "u_pat1",
        "Aarav Mehta",
        "patient@demo.com",
        "9000000001",
        "1998-04-12",
        "Male",
        1,
      ),
      pat(
        "u_pat2",
        "Isha Rao",
        "isha@demo.com",
        "9000000002",
        "1991-09-03",
        "Female",
        2,
      ),
      pat(
        "u_pat3",
        "Kabir Shah",
        "kabir@demo.com",
        "9000000003",
        "1975-01-22",
        "Male",
        3,
      ),
      pat(
        "u_pat4",
        "Naina Desai",
        "naina@demo.com",
        "9000000004",
        "1988-11-30",
        "Female",
        4,
      ),
      pat(
        "u_pat5",
        "Rohan Kulkarni",
        "rohan@demo.com",
        "9000000005",
        "2001-06-18",
        "Male",
        5,
      ),
      staff(
        "u_admin",
        "admin",
        "Anika Verma",
        "admin@demo.com",
        emp(90000, 24, "2018-04-01", "9000000031", "Day"),
      ),
      staff(
        "u_rec1",
        "receptionist",
        "Rahul Sen",
        "reception@demo.com",
        emp(28000, 22, "2022-08-08", "9000000032", "Day"),
      ),
      staff(
        "u_doc1",
        "doctor",
        "Dr. Meera Iyer",
        "doctor@demo.com",
        emp(120000, 21, "2021-06-01", "9000000011", "Day"),
        { doctorId: "doc1" },
      ),
      staff(
        "u_doc2",
        "doctor",
        "Dr. Arjun Nair",
        "doctor2@demo.com",
        emp(150000, 20, "2020-02-10", "9000000012", "Day"),
        { doctorId: "doc2" },
      ),
      staff(
        "u_doc3",
        "doctor",
        "Dr. Sana Qureshi",
        "doctor3@demo.com",
        emp(140000, 19, "2022-01-15", "9000000013", "Day"),
        { doctorId: "doc3" },
      ),
      staff(
        "u_doc4",
        "doctor",
        "Dr. Vikram Joshi",
        "doctor4@demo.com",
        emp(130000, 22, "2019-09-01", "9000000014", "Day"),
        { doctorId: "doc4" },
      ),
      staff(
        "u_nur1",
        "nurse",
        "Nurse Kavya Pillai",
        "nurse@demo.com",
        emp(38000, 23, "2023-03-20", "9000000021", "Night"),
      ),
      staff(
        "u_nur2",
        "nurse",
        "Nurse Joseph Dsouza",
        "nurse2@demo.com",
        emp(36000, 21, "2024-01-05", "9000000022", "Day"),
      ),
    ],
    appointments: [
      {
        id: "apt_done",
        patientId: "u_pat1",
        doctorId: "doc1",
        date: addDays(-1),
        time: "10:00",
        reason: "Fever",
        status: "completed",
        createdAt: ago(3),
      },
      {
        id: "apt_ns",
        patientId: "u_pat5",
        doctorId: "doc4",
        date: addDays(-2),
        time: "11:00",
        reason: "Checkup",
        status: "no_show",
        createdAt: ago(4),
      },
      {
        id: "apt_t1",
        patientId: "u_pat1",
        doctorId: "doc1",
        date: ymd(),
        time: "15:00",
        reason: "Follow-up",
        status: "scheduled",
        createdAt: ago(1),
      },
      {
        id: "apt_t2",
        patientId: "u_pat5",
        doctorId: "doc1",
        date: ymd(),
        time: "15:30",
        reason: "Cough",
        status: "checked_in",
        createdAt: ago(1),
      },
      {
        id: "apt_n1",
        patientId: "u_pat5",
        doctorId: "doc4",
        date: addDays(1),
        time: "09:30",
        reason: "Vaccination",
        status: "scheduled",
        createdAt: ago(0.5),
      },
    ],
    prescriptions: [
      {
        id: "rx1",
        appointmentId: "apt_done",
        patientId: "u_pat1",
        doctorId: "doc1",
        notes: "Viral fever. Rest and fluids.",
        items: [
          {
            medicineId: "m1",
            name: "Paracetamol 500mg",
            qty: 10,
            unitPrice: 2,
            dosage: "1-0-1 after food",
          },
        ],
        createdAt: ago(1),
      },
    ],
    bills: [
      {
        id: "bill1",
        number: "CF-B-0001",
        patientId: "u_pat1",
        appointmentId: "apt_done",
        lines: [
          {
            description: "Consultation – Dr. Meera Iyer",
            qty: 1,
            unitPrice: 500,
          },
          { description: "Paracetamol 500mg", qty: 10, unitPrice: 2 },
        ],
        total: 520,
        discount: 0,
        status: "paid",
        state: "issued",
        issueDate: addDays(-1),
        dueDate: addDays(6),
        payments: [
          {
            id: "pay1",
            amount: 520,
            method: "UPI",
            paidAt: ago(1),
            reference: "",
          },
        ],
        createdAt: ago(1),
        paidAt: ago(1),
      },
      {
        id: "bill2",
        number: "CF-B-0002",
        patientId: "u_pat5",
        lines: [
          {
            description: "Consultation – Dr. Arjun Nair",
            qty: 1,
            unitPrice: 900,
          },
        ],
        total: 900,
        discount: 0,
        status: "unpaid",
        state: "issued",
        issueDate: addDays(-10),
        dueDate: addDays(-3),
        payments: [],
        createdAt: ago(10),
      },
    ],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt -> reseed */
  }
  const db = seed();
  save(db);
  return db;
}
export const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
export const resetDb = () => {
  localStorage.removeItem(KEY);
  return load();
};
