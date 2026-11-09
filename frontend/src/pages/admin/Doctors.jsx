import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as admin from "../../api/admin";
import { useSnapshot, useQ } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Table,
  inr,
} from "../../components/ui";
import { Err, Gate, useToast } from "../../components/ui2";
import { byId } from "../../lib/selectors";
import { ymd } from "../../api/mockDb";

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
];
const TIMES = Array.from({ length: 25 }, (_, i) => {
  const m = 420 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const blank = {
  name: "",
  deptId: "",
  specialty: "",
  qualification: "",
  phone: "",
  email: "",
  fee: 500,
  days: [1, 2, 3, 4, 5],
  start: "09:00",
  end: "17:00",
  status: "active",
};

function DoctorForm({ doc, db, onClose, onSaved }) {
  const [f, setF] = useState(doc || blank);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    const e = {};
    if (!f.name.trim()) e.name = "Enter a name.";
    if (!f.deptId) e.deptId = "Select a department.";
    if (!f.specialty.trim()) e.specialty = "Enter a specialty.";
    if (!/^\d{10}$/.test(f.phone)) e.phone = "Enter a valid 10-digit phone.";
    if (!(+f.fee >= 0)) e.fee = "Fee cannot be negative.";
    if (!doc && !/^\S+@\S+\.\S+$/.test(f.email || ""))
      e.email = "Enter a valid email (used for login).";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await admin.saveDoctor({
        ...f,
        fee: +f.fee,
        name: f.name.trim(),
        id: doc?.id,
        email: f.email || "",
      });
      onSaved();
    } catch (x) {
      setErrs({ form: x.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal wide title={doc ? "Edit doctor" : "Add doctor"} onClose={onClose}>
      <div className="space-y-4">
        <Err msg={errs.form} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" required error={errs.name}>
            <Input value={f.name} onChange={set("name")} />
          </Field>
          <Field label="Department" required error={errs.deptId}>
            <Select value={f.deptId} onChange={set("deptId")}>
              <option value="">Select</option>
              {db.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Specialty" required error={errs.specialty}>
            <Input value={f.specialty} onChange={set("specialty")} />
          </Field>
          <Field label="Qualification">
            <Input value={f.qualification} onChange={set("qualification")} />
          </Field>
          <Field label="Phone" required error={errs.phone}>
            <Input
              inputMode="numeric"
              value={f.phone}
              onChange={set("phone")}
            />
          </Field>
          {!doc && (
            <Field
              label="Login email"
              required
              error={errs.email}
              helper="Initial password: doctor123"
            >
              <Input type="email" value={f.email} onChange={set("email")} />
            </Field>
          )}
          <Field label="Consultation fee (₹)" required error={errs.fee}>
            <Input type="number" min="0" value={f.fee} onChange={set("fee")} />
          </Field>
          {doc && (
            <Field label="Status">
              <Select value={f.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          )}
        </div>
        <fieldset className="border border-line rounded-xl p-3">
          <legend className="text-xs font-semibold px-1">
            Weekly availability (Sunday off, lunch 13:00–14:00)
          </legend>
          <div className="flex flex-wrap gap-3 mb-3">
            {DAYS.map(([n, l]) => (
              <label key={n} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={f.days.includes(n)}
                  onChange={(e) =>
                    setF({
                      ...f,
                      days: e.target.checked
                        ? [...f.days, n]
                        : f.days.filter((x) => x !== n),
                    })
                  }
                />{" "}
                {l}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Select value={f.start} onChange={set("start")}>
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="End">
              <Select value={f.end} onChange={set("end")}>
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            {doc ? "Save changes" : "Add doctor"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Doctors() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";
  const s = useSnapshot();
  const [get, set] = useQ({ q: "", dept: "", status: "active" });
  const [form, setForm] = useState(null);
  const [toast, show] = useToast();
  return (
    <>
      <PageHeader
        title="Doctors"
        description={
          isAdmin
            ? "Manage doctors, fees and weekly availability."
            : "Doctor directory (read-only)."
        }
        action={
          isAdmin && <Button onClick={() => setForm({})}>Add doctor</Button>
        }
      />
      {toast}
      <Gate s={s}>
        {(db) => {
          const Dp = byId(db.departments);
          const today = ymd();
          const q = get("q").toLowerCase();
          const rows = db.doctors
            .filter(
              (d) =>
                (get("status") === "all" ||
                  (d.status || "active") === get("status")) &&
                (!get("dept") || d.deptId === get("dept")) &&
                (!q || `${d.name} ${d.specialty}`.toLowerCase().includes(q)),
            )
            .sort((a, b) => a.name.localeCompare(b.name));
          return (
            <>
              {form && (
                <DoctorForm
                  doc={form.id ? form : null}
                  db={db}
                  onClose={() => setForm(null)}
                  onSaved={() => {
                    setForm(null);
                    show("Doctor saved.");
                    s.reload();
                  }}
                />
              )}
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <Field label="Search">
                  <Input
                    placeholder="Name or specialty"
                    value={get("q")}
                    onChange={(e) => set({ q: e.target.value })}
                  />
                </Field>
                <Field label="Department">
                  <Select
                    value={get("dept")}
                    onChange={(e) => set({ dept: e.target.value })}
                  >
                    <option value="">All</option>
                    {db.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={get("status")}
                    onChange={(e) => set({ status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                  </Select>
                </Field>
              </div>
              <Card>
                {rows.length === 0 ? (
                  <Empty title="No doctors match these filters." />
                ) : (
                  <Table
                    caption="Doctors"
                    heads={[
                      "Doctor",
                      "Department",
                      "Fee",
                      "Schedule",
                      "Booked today",
                      "Status",
                      ...(isAdmin ? [""] : []),
                    ]}
                  >
                    {rows.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <b>{d.name}</b>
                          <p className="text-xs text-muted">
                            {d.specialty} · {d.qualification}
                          </p>
                        </td>
                        <td>{Dp[d.deptId]?.name}</td>
                        <td className="tabular-nums">{inr(d.fee)}</td>
                        <td className="text-xs">
                          {DAYS.filter(([n]) => d.days.includes(n))
                            .map(([, l]) => l)
                            .join(", ")}
                          <br />
                          <span className="tabular-nums">
                            {d.start}–{d.end}
                          </span>
                        </td>
                        <td className="tabular-nums">
                          {
                            db.appointments.filter(
                              (a) =>
                                a.doctorId === d.id &&
                                a.date === today &&
                                a.status !== "cancelled",
                            ).length
                          }
                        </td>
                        <td>
                          <Badge status={d.status || "active"} />
                        </td>
                        {isAdmin && (
                          <td>
                            <Button
                              variant="ghost"
                              aria-label={`Edit ${d.name}`}
                              onClick={() => setForm(d)}
                            >
                              Edit
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>
            </>
          );
        }}
      </Gate>
    </>
  );
}
