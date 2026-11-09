import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Table,
  Textarea,
  fmtDate,
  inr,
} from "../../components/ui";

function CompleteModal({ appt, onClose, onDone }) {
  const [meds, setMeds] = useState([]);
  const [rows, setRows] = useState([{ medicineId: "", qty: 1, dosage: "" }]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.listMedicines().then(setMeds);
  }, []);

  const price = (id) => meds.find((m) => m.id === id)?.price || 0;
  const medTotal = rows.reduce(
    (s, r) => s + price(r.medicineId) * (+r.qty || 0),
    0,
  );
  const fee = appt.doctor.fee;
  const setRow = (i, k, v) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.completeAppointment(appt.id, { notes, items: rows });
      onDone();
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      wide
      title={`Complete visit · ${appt.patient.name}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        {err && (
          <p
            role="alert"
            className="bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3"
          >
            {err}
          </p>
        )}
        <Field label="Visit notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <div>
          <p className="text-xs font-semibold mb-2">Medicines</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_1fr_44px] gap-2">
                <Select
                  aria-label="Medicine"
                  value={r.medicineId}
                  onChange={(e) => setRow(i, "medicineId", e.target.value)}
                >
                  <option value="">Select medicine</option>
                  {meds.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {inr(m.price)}
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  value={r.qty}
                  onChange={(e) => setRow(i, "qty", e.target.value)}
                />
                <Input
                  aria-label="Dosage"
                  placeholder="1-0-1 after food"
                  value={r.dosage}
                  onChange={(e) => setRow(i, "dosage", e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Remove medicine"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="grid place-items-center rounded-lg hover:bg-[#FDEDEE]"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() =>
              setRows([...rows, { medicineId: "", qty: 1, dosage: "" }])
            }
          >
            <Plus size={16} /> Add medicine
          </Button>
        </div>
        <dl className="bg-softblue border border-bluebd rounded-xl p-4 tabular-nums space-y-1">
          <div className="flex justify-between">
            <dt>Consultation fee</dt>
            <dd>{inr(fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Medicines</dt>
            <dd>{inr(medTotal)}</dd>
          </div>
          <div className="flex justify-between font-semibold border-t border-bluebd pt-1">
            <dt>Bill total (auto-generated)</dt>
            <dd>{inr(fee + medTotal)}</dd>
          </div>
        </dl>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Complete & generate bill
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Schedule() {
  const { user } = useAuth();
  const isDoctor = user.role === "doctor";
  const [rows, setRows] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [completing, setCompleting] = useState(null);
  const [error, setError] = useState("");
  const load = () => api.listStaffAppointments(user).then(setRows);
  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const move = async (a, next) => {
    setError("");
    try {
      await api.transitionAppointment(a.id, next);
      load();
    } catch (x) {
      setError(x.message);
    }
  };
  const day = (rows || []).filter((a) => a.date === date);

  return (
    <>
      <PageHeader
        title={isDoctor ? "My schedule" : "All appointments"}
        description="Check patients in and move the day along."
        action={
          <div className="w-48">
            <Input
              aria-label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        }
      />
      {error && (
        <p
          role="alert"
          className="mb-4 bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3"
        >
          {error}
        </p>
      )}
      <Card>
        {!rows ? (
          <Loading />
        ) : day.length === 0 ? (
          <Empty title="No appointments for this day.">{fmtDate(date)}</Empty>
        ) : (
          <Table
            caption="Appointments for the selected day"
            heads={[
              "Time",
              "Patient",
              ...(isDoctor ? [] : ["Doctor"]),
              "Reason",
              "Status",
              "Actions",
            ]}
          >
            {day.map((a) => (
              <tr key={a.id}>
                <td className="tabular-nums font-medium">{a.time}</td>
                <td>
                  {a.patient.name}
                  <p className="text-xs text-muted">{a.patient.phone}</p>
                </td>
                {!isDoctor && <td>{a.doctor.name}</td>}
                <td className="max-w-[220px] truncate">{a.reason || "—"}</td>
                <td>
                  <Badge status={a.status} />
                </td>
                <td className="space-x-2 whitespace-nowrap">
                  {a.status === "scheduled" && (
                    <Button
                      variant="secondary"
                      onClick={() => move(a, "checked_in")}
                    >
                      Check in
                    </Button>
                  )}
                  {isDoctor && a.status === "checked_in" && (
                    <Button onClick={() => move(a, "in_consultation")}>
                      Start
                    </Button>
                  )}
                  {isDoctor && a.status === "in_consultation" && (
                    <Button variant="lime" onClick={() => setCompleting(a)}>
                      Complete
                    </Button>
                  )}
                  {["scheduled", "checked_in"].includes(a.status) && (
                    <Button
                      variant="ghost"
                      onClick={() => move(a, "cancelled")}
                    >
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {completing && (
        <CompleteModal
          appt={completing}
          onClose={() => setCompleting(null)}
          onDone={() => {
            setCompleting(null);
            load();
          }}
        />
      )}
    </>
  );
}
