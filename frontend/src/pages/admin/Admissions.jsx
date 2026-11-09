import { useState } from "react";
import { Link } from "react-router-dom";
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
  Stat,
  Table,
  Textarea,
  inr,
} from "../../components/ui";
import { Err, Gate, Tabs, useToast } from "../../components/ui2";
import {
  balanceOf,
  bills,
  byId,
  fmtDT,
  stayDays,
  toLocalInput,
} from "../../lib/selectors";
import { addDays, ymd } from "../../api/mockDb";

function AdmitModal({ db, bedId, onClose, onDone }) {
  const { user } = useAuth();
  const bed0 = db.beds.find((b) => b.id === bedId);
  const busyPatients = new Set(
    db.admissions.filter((a) => a.status === "active").map((a) => a.patientId),
  );
  const pts = db.users.filter(
    (u) =>
      u.role === "patient" &&
      u.status !== "archived" &&
      !busyPatients.has(u.id),
  );
  const [f, setF] = useState({
    patientId: "",
    doctorId: "",
    wardId: bed0?.wardId || "",
    bedId: bedId || "",
    reason: "",
    admittedAt: toLocalInput(),
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const beds = db.beds.filter(
    (b) => b.wardId === f.wardId && b.status === "available",
  );
  const submit = async () => {
    if (!f.patientId || !f.doctorId || !f.bedId || !f.reason.trim())
      return setErr(
        "Select a patient, doctor, ward and bed, and enter the admission reason.",
      );
    setBusy(true);
    setErr("");
    try {
      await admin.admitPatient(f);
      onDone("Patient admitted.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal wide title="Admit patient" onClose={onClose}>
      <div className="space-y-3">
        <Err msg={err} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Patient" required>
            <Select
              value={f.patientId}
              onChange={(e) => setF({ ...f, patientId: e.target.value })}
            >
              <option value="">Select</option>
              {pts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.mrn}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Attending doctor" required>
            <Select
              value={f.doctorId}
              onChange={(e) => setF({ ...f, doctorId: e.target.value })}
            >
              <option value="">Select</option>
              {db.doctors
                .filter((d) => d.status !== "inactive")
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Ward" required>
            <Select
              value={f.wardId}
              onChange={(e) =>
                setF({ ...f, wardId: e.target.value, bedId: "" })
              }
            >
              <option value="">Select</option>
              {db.wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Available bed" required>
            <Select
              value={f.bedId}
              onChange={(e) => setF({ ...f, bedId: e.target.value })}
            >
              <option value="">
                {f.wardId
                  ? beds.length
                    ? "Select"
                    : "No beds available"
                  : "Choose a ward first"}
              </option>
              {beds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} · {inr(b.rate)}/night
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Admitted at"
            helper={
              user.role === "admin"
                ? "Administrators may backdate up to 7 days."
                : "Defaults to now."
            }
          >
            <Input
              type="datetime-local"
              disabled={user.role !== "admin"}
              max={toLocalInput()}
              min={toLocalInput(new Date(Date.now() - 7 * 864e5))}
              value={f.admittedAt}
              onChange={(e) => setF({ ...f, admittedAt: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label="Admission reason"
          required
          helper={`${f.reason.length}/300`}
        >
          <Textarea
            maxLength={300}
            value={f.reason}
            onChange={(e) => setF({ ...f, reason: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Admit patient
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({ db, a, onClose, onDone }) {
  const [bedId, setBedId] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const W = byId(db.wards);
  const free = db.beds.filter((b) => b.status === "available");
  const submit = async () => {
    if (!bedId || !reason.trim())
      return setErr("Select a target bed and enter a reason.");
    setBusy(true);
    setErr("");
    try {
      await admin.transferBed(a.id, bedId, reason);
      onDone("Patient transferred.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Transfer bed" onClose={onClose}>
      <div className="space-y-3">
        <Err msg={err} />
        <Field label="Target bed" required>
          <Select value={bedId} onChange={(e) => setBedId(e.target.value)}>
            <option value="">
              {free.length ? "Select" : "No beds available"}
            </option>
            {free.map((b) => (
              <option key={b.id} value={b.id}>
                {W[b.wardId].name} · {b.code} · {inr(b.rate)}/night
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reason" required>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DischargeModal({ db, a, onClose, onDone }) {
  const bed = db.beds.find((b) => b.id === a.bedId);
  const ward = db.wards.find((w) => w.id === bed.wardId);
  const [when, setWhen] = useState(toLocalInput());
  const [summary, setSummary] = useState("");
  const [invoice, setInvoice] = useState(true);
  const [qty, setQty] = useState(stayDays(a.admittedAt));
  const [rate, setRate] = useState(bed.rate);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = bills(db).filter(
    (b) =>
      b.patientId === a.patientId && b.state === "issued" && balanceOf(b) > 0,
  );
  const submit = async () => {
    if (!summary.trim()) return setErr("Enter a discharge summary.");
    setBusy(true);
    setErr("");
    try {
      await admin.dischargePatient(a.id, { dischargedAt: when, summary });
      if (invoice)
        await admin.saveInvoice({
          patientId: a.patientId,
          admissionId: a.id,
          issueDate: ymd(),
          dueDate: addDays(7),
          lines: [
            {
              description: `Room charges – ${ward.name} ${bed.code}`,
              qty: +qty,
              unitPrice: +rate,
            },
          ],
          discount: 0,
          issue: true,
        });
      onDone("Patient discharged.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal wide title="Prepare discharge" onClose={onClose}>
      <div className="space-y-3">
        <Err msg={err} />
        <Field label="Discharge time" required>
          <Input
            type="datetime-local"
            min={toLocalInput(new Date(a.admittedAt))}
            max={toLocalInput()}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </Field>
        <Field label="Discharge summary" required>
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Field>
        {pending.length > 0 && (
          <div className="bg-[#FFF4D6] text-[#785400] rounded-lg p-3">
            Unpaid invoices stay open:{" "}
            {pending.map((b) => (
              <Link
                key={b.id}
                className="underline mr-2"
                to={`/admin/billing/${b.id}`}
              >
                {b.number}
              </Link>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={invoice}
            onChange={(e) => setInvoice(e.target.checked)}
          />{" "}
          Create room-charge invoice
        </label>
        {invoice && (
          <div className="grid grid-cols-2 gap-3 bg-softblue border border-bluebd rounded-xl p-3">
            <Field
              label="Billable days"
              helper="Suggested billable days—confirm before saving."
            >
              <Input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </Field>
            <Field label="Rate per day (₹)">
              <Input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
            <p className="col-span-2 tabular-nums">
              Room total: <b>{inr(Math.round(qty * rate) || 0)}</b>. Bed
              transfers are recorded but not auto-priced.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Confirm discharge
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailsModal({ db, a, onClose }) {
  const B = byId(db.beds);
  return (
    <Modal title="Admission details" onClose={onClose}>
      <p className="mb-2">{a.reason}</p>
      {a.dischargeSummary && (
        <p className="mb-2">
          <b>Discharge summary:</b> {a.dischargeSummary}
        </p>
      )}
      <h3 className="font-semibold mt-3 mb-1">Timeline</h3>
      <ul className="space-y-1">
        <li>{fmtDT(a.admittedAt)} — Admitted</li>
        {a.transfers.map((t) => (
          <li key={t.id}>
            {fmtDT(t.at)} — {B[t.fromBedId]?.code} → {B[t.toBedId]?.code}{" "}
            <span className="text-muted">({t.reason})</span>
          </li>
        ))}
        {a.dischargedAt && <li>{fmtDT(a.dischargedAt)} — Discharged</li>}
      </ul>
    </Modal>
  );
}

export default function Admissions() {
  const { user } = useAuth();
  const s = useSnapshot();
  const [get, set] = useQ({ tab: "admissions", ward: "", status: "active" });
  const [modal, setModal] = useState(null);
  const [toast, show] = useToast();
  const [err, setErr] = useState("");
  const done = (m) => {
    setModal(null);
    show(m);
    s.reload();
  };
  const maint = async (b) => {
    try {
      if (b.status === "maintenance")
        await admin.setBedMaintenance(b.id, false);
      else {
        const r = window.prompt("Reason for maintenance?");
        if (r == null) return;
        await admin.setBedMaintenance(b.id, true, r);
      }
      s.reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <>
      <PageHeader
        title="Admissions & beds"
        description="Admit, transfer and discharge patients."
        action={
          <Button onClick={() => setModal({ type: "admit" })}>
            Admit patient
          </Button>
        }
      />
      {toast}
      <Err msg={err} />
      <Gate s={s}>
        {(db) => {
          const P = byId(db.users);
          const D = byId(db.doctors);
          const B = byId(db.beds);
          const W = byId(db.wards);
          const rows = db.admissions
            .filter(
              (a) =>
                (get("status") === "all" || a.status === get("status")) &&
                (!get("ward") || B[a.bedId]?.wardId === get("ward")),
            )
            .sort((a, b) =>
              a.status === b.status
                ? b.admittedAt.localeCompare(a.admittedAt)
                : a.status === "active"
                  ? -1
                  : 1,
            );
          const cnt = (k) => db.beds.filter((b) => b.status === k).length;
          const beds = db.beds.filter(
            (b) => !get("ward") || b.wardId === get("ward"),
          );
          return (
            <>
              {modal?.type === "admit" && (
                <AdmitModal
                  db={db}
                  bedId={modal.bedId}
                  onClose={() => setModal(null)}
                  onDone={done}
                />
              )}
              {modal?.type === "transfer" && (
                <TransferModal
                  db={db}
                  a={modal.a}
                  onClose={() => setModal(null)}
                  onDone={done}
                />
              )}
              {modal?.type === "discharge" && (
                <DischargeModal
                  db={db}
                  a={modal.a}
                  onClose={() => setModal(null)}
                  onDone={done}
                />
              )}
              {modal?.type === "details" && (
                <DetailsModal
                  db={db}
                  a={modal.a}
                  onClose={() => setModal(null)}
                />
              )}
              <Tabs
                value={get("tab")}
                onChange={(t) => set({ tab: t })}
                tabs={[
                  ["admissions", "Admissions"],
                  ["beds", "Bed board"],
                ]}
              />
              <div className="flex flex-wrap gap-3 mb-4">
                <Field label="Ward">
                  <Select
                    value={get("ward")}
                    onChange={(e) => set({ ward: e.target.value })}
                  >
                    <option value="">All wards</option>
                    {db.wards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                {get("tab") === "admissions" && (
                  <Field label="Status">
                    <Select
                      value={get("status")}
                      onChange={(e) => set({ status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="discharged">Discharged</option>
                      <option value="all">All</option>
                    </Select>
                  </Field>
                )}
              </div>
              {get("tab") === "admissions" ? (
                <Card>
                  {rows.length === 0 ? (
                    <Empty title="No admissions match these filters." />
                  ) : (
                    <Table
                      caption="Admissions"
                      heads={[
                        "ID",
                        "Patient",
                        "Attending",
                        "Ward / bed",
                        "Admitted",
                        "Stay",
                        "Status",
                        "Actions",
                      ]}
                    >
                      {rows.map((a) => (
                        <tr key={a.id}>
                          <td className="tabular-nums text-xs">
                            {a.id.toUpperCase()}
                          </td>
                          <td className="font-medium">
                            {P[a.patientId]?.name}
                          </td>
                          <td>{D[a.doctorId]?.name}</td>
                          <td>
                            {W[B[a.bedId]?.wardId]?.name} · {B[a.bedId]?.code}
                          </td>
                          <td>{fmtDT(a.admittedAt)}</td>
                          <td className="tabular-nums">
                            {stayDays(
                              a.admittedAt,
                              a.dischargedAt || new Date(),
                            )}{" "}
                            day(s)
                          </td>
                          <td>
                            <Badge status={a.status} />
                          </td>
                          <td className="whitespace-nowrap">
                            <Button
                              variant="ghost"
                              aria-label={`Details for ${P[a.patientId]?.name}`}
                              onClick={() => setModal({ type: "details", a })}
                            >
                              Details
                            </Button>
                            {a.status === "active" && (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    setModal({ type: "transfer", a })
                                  }
                                >
                                  Transfer
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    setModal({ type: "discharge", a })
                                  }
                                >
                                  Discharge
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Stat label="Available" value={cnt("available")} />
                    <Stat label="Occupied" value={cnt("occupied")} />
                    <Stat label="Maintenance" value={cnt("maintenance")} />
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {beds.map((b) => {
                      const adm = db.admissions.find(
                        (a) => a.bedId === b.id && a.status === "active",
                      );
                      return (
                        <Card key={b.id}>
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold tabular-nums">
                                {b.code}
                              </p>
                              <p className="text-xs text-muted">
                                {W[b.wardId].name} · {inr(b.rate)}/night
                              </p>
                            </div>
                            <Badge status={b.status} />
                          </div>
                          <div className="mt-3">
                            {b.status === "occupied" && (
                              <>
                                <p>{P[adm?.patientId]?.name}</p>
                                <Button
                                  variant="ghost"
                                  onClick={() =>
                                    setModal({ type: "details", a: adm })
                                  }
                                >
                                  View admission
                                </Button>
                              </>
                            )}
                            {b.status === "available" && (
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  setModal({ type: "admit", bedId: b.id })
                                }
                              >
                                Admit here
                              </Button>
                            )}
                            {b.status === "maintenance" && (
                              <p className="text-muted">
                                Reason: {b.maintenanceReason}
                              </p>
                            )}
                            {user.role === "admin" &&
                              b.status !== "occupied" && (
                                <Button
                                  variant="ghost"
                                  onClick={() => maint(b)}
                                >
                                  {b.status === "maintenance"
                                    ? "Return to service"
                                    : "Mark maintenance"}
                                </Button>
                              )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          );
        }}
      </Gate>
    </>
  );
}
