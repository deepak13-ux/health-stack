import { useEffect, useState } from "react";
import * as api from "../api/api";
import { ymd } from "../api/mockDb";
import {
  Button,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  Textarea,
  inr,
} from "./ui";
import { Err } from "./ui2";
import PatientForm from "./PatientForm";

export default function AdminBookModal({
  db,
  patientId = "",
  onClose,
  onBooked,
}) {
  const [pts, setPts] = useState(
    db.users.filter((u) => u.role === "patient" && u.status !== "archived"),
  );
  const [f, setF] = useState({
    patientId,
    deptId: "",
    doctorId: "",
    date: ymd(),
    time: "",
    reason: "",
  });
  const [q, setQ] = useState("");
  const [slots, setSlots] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [reg, setReg] = useState(false);
  const docs = db.doctors.filter(
    (d) => d.status !== "inactive" && (!f.deptId || d.deptId === f.deptId),
  );
  const doc = db.doctors.find((d) => d.id === f.doctorId);
  const list = pts.filter(
    (p) =>
      p.id === f.patientId ||
      `${p.name} ${p.mrn} ${p.phone}`.toLowerCase().includes(q.toLowerCase()),
  );

  const loadSlots = () => {
    if (f.doctorId && f.date) {
      setSlots(null);
      api.getSlots(f.doctorId, f.date).then(setSlots);
    } else setSlots(null);
  };
  useEffect(() => {
    setF((x) => ({ ...x, time: "" }));
    loadSlots(); /* eslint-disable-next-line */
  }, [f.doctorId, f.date]);

  const book = async () => {
    if (!f.patientId) return setErr("Select a patient.");
    if (!f.doctorId) return setErr("Select a doctor.");
    if (!f.time) return setErr("Select a time slot.");
    setBusy(true);
    setErr("");
    try {
      await api.bookAppointment(f);
      onBooked();
    } catch (x) {
      setErr(x.message);
      setF((y) => ({ ...y, time: "" }));
      loadSlots();
    } finally {
      // keep other fields, refresh slots
      setBusy(false);
    }
  };

  return (
    <>
      <Modal wide title="Book appointment" onClose={onClose}>
        <div className="space-y-4">
          <Err msg={err} />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Field label="Patient" required>
                <Select
                  value={f.patientId}
                  onChange={(e) => setF({ ...f, patientId: e.target.value })}
                >
                  <option value="">Select patient</option>
                  {list.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.mrn}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2 mt-1">
                <Input
                  aria-label="Filter patients"
                  placeholder="Type to filter"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="!h-9"
                />
                <Button
                  variant="ghost"
                  className="!h-9 whitespace-nowrap"
                  onClick={() => setReg(true)}
                >
                  Register patient
                </Button>
              </div>
            </div>
            <Field label="Department" required>
              <Select
                value={f.deptId}
                onChange={(e) =>
                  setF({ ...f, deptId: e.target.value, doctorId: "" })
                }
              >
                <option value="">All departments</option>
                {db.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Doctor" required>
              <Select
                value={f.doctorId}
                onChange={(e) => setF({ ...f, doctorId: e.target.value })}
              >
                <option value="">Select doctor</option>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" required>
              <Input
                type="date"
                min={ymd()}
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
            </Field>
          </div>
          <div>
            <p className="text-xs font-semibold mb-2">Available time slots *</p>
            {!f.doctorId ? (
              <p className="text-muted">Choose a doctor to see slots.</p>
            ) : !slots ? (
              <Loading />
            ) : slots.length === 0 ? (
              <p className="text-muted">
                This doctor doesn’t work on this day.
              </p>
            ) : slots.every((s) => !s.available) ? (
              <p className="text-muted">
                No available slots. Choose another doctor or date.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    aria-pressed={f.time === s.time}
                    onClick={() => setF({ ...f, time: s.time })}
                    className={`h-11 rounded-[10px] border tabular-nums ${f.time === s.time ? "bg-primary text-white border-primary" : "border-control bg-white hover:bg-softblue"} disabled:bg-[#EDF2F6] disabled:text-[#43586B] disabled:line-through disabled:cursor-not-allowed`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Field label="Reason" helper={`${f.reason.length}/300`}>
            <Textarea
              maxLength={300}
              value={f.reason}
              onChange={(e) => setF({ ...f, reason: e.target.value })}
            />
          </Field>
          <div className="flex justify-between items-center">
            <p className="text-muted">
              {doc && (
                <>
                  Fee <b className="text-ink tabular-nums">{inr(doc.fee)}</b>
                </>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button loading={busy} onClick={book}>
                Book appointment
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {reg && (
        <PatientForm
          patients={pts}
          onClose={() => setReg(false)}
          onSaved={(u) => {
            setPts([...pts, u]);
            setF((x) => ({ ...x, patientId: u.id }));
            setReg(false);
          }}
        />
      )}
    </>
  );
}
