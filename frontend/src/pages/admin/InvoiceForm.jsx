import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import * as admin from "../../api/admin";
import { useSnapshot } from "../../hooks";
import {
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  inr,
} from "../../components/ui";
import { Err, Gate } from "../../components/ui2";
import { bills, byId, stayDays } from "../../lib/selectors";
import { addDays, uid, ymd } from "../../api/mockDb";

const line = () => ({ id: uid("li"), description: "", qty: 1, unitPrice: 0 });

function Form({ db, bill }) {
  const nav = useNavigate();
  const [f, setF] = useState({
    patientId: bill?.patientId || "",
    link: bill?.appointmentId
      ? "appointment"
      : bill?.admissionId
        ? "admission"
        : "none",
    linkId: bill?.appointmentId || bill?.admissionId || "",
    issueDate: bill?.issueDate || ymd(),
    dueDate: bill?.dueDate || addDays(7),
    discount: bill?.discount || 0,
    notes: bill?.notes || "",
  });
  const [lines, setLines] = useState(
    bill?.lines.map((l) => ({ ...l, id: uid("li") })) || [line()],
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const D = byId(db.doctors);
  const B = byId(db.beds);
  const W = byId(db.wards);
  const appts = db.appointments.filter(
    (a) => a.patientId === f.patientId && a.status === "completed",
  );
  const adms = db.admissions.filter((a) => a.patientId === f.patientId);
  const pristine =
    lines.length === 1 && !lines[0].description && !lines[0].unitPrice;
  const subtotal = lines.reduce(
    (s, l) => s + Math.round((+l.qty || 0) * (+l.unitPrice || 0)),
    0,
  );
  const total = subtotal - (+f.discount || 0);
  const setLine = (id, k, v) =>
    setLines(lines.map((l) => (l.id === id ? { ...l, [k]: v } : l)));

  const pickLink = (linkId) => {
    setF((x) => ({ ...x, linkId }));
    if (!linkId || !pristine) return;
    if (f.link === "appointment") {
      const d = D[appts.find((a) => a.id === linkId).doctorId];
      setLines([
        {
          ...line(),
          description: `Consultation – ${d.name}`,
          unitPrice: d.fee,
        },
      ]);
    }
    if (f.link === "admission") {
      const a = adms.find((x) => x.id === linkId);
      const bed = B[a.bedId];
      setLines([
        {
          ...line(),
          description: `Room charges – ${W[bed.wardId].name} ${bed.code}`,
          qty: stayDays(a.admittedAt, a.dischargedAt || new Date()),
          unitPrice: bed.rate,
        },
      ]);
    }
  };
  const save = async (issue) => {
    setBusy(issue ? "issue" : "draft");
    setErr("");
    try {
      const b = await admin.saveInvoice({
        id: bill?.id,
        patientId: f.patientId,
        appointmentId: f.link === "appointment" ? f.linkId || null : null,
        admissionId: f.link === "admission" ? f.linkId || null : null,
        issueDate: f.issueDate,
        dueDate: f.dueDate,
        lines: lines.map((l) => ({
          ...l,
          qty: +l.qty,
          unitPrice: +l.unitPrice,
        })),
        discount: +f.discount || 0,
        notes: f.notes,
        issue,
      });
      nav(`/admin/billing/${b.id}`);
    } catch (e) {
      setErr(e.message);
      window.scrollTo(0, 0);
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <PageHeader
        title={bill ? `Edit ${bill.number}` : "Create invoice"}
        description="Tax is 0 in this demo. Issuing freezes the line items."
      />
      <Err msg={err} />
      <div className="grid xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Patient" required>
                <Select
                  value={f.patientId}
                  onChange={(e) =>
                    setF({
                      ...f,
                      patientId: e.target.value,
                      link: "none",
                      linkId: "",
                    })
                  }
                >
                  <option value="">Select patient</option>
                  {db.users
                    .filter((u) => u.role === "patient")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.mrn}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Link to">
                <Select
                  value={f.link}
                  disabled={!f.patientId}
                  onChange={(e) =>
                    setF({ ...f, link: e.target.value, linkId: "" })
                  }
                >
                  <option value="none">Nothing</option>
                  <option value="appointment">Completed appointment</option>
                  <option value="admission">Admission</option>
                </Select>
              </Field>
              {f.link !== "none" && (
                <Field
                  label={f.link === "appointment" ? "Appointment" : "Admission"}
                >
                  <Select
                    value={f.linkId}
                    onChange={(e) => pickLink(e.target.value)}
                  >
                    <option value="">Select</option>
                    {(f.link === "appointment" ? appts : adms).map((x) => (
                      <option key={x.id} value={x.id}>
                        {f.link === "appointment"
                          ? `${x.date} ${x.time} · ${D[x.doctorId]?.name}`
                          : `${new Date(x.admittedAt).toLocaleDateString("en-IN")} · ${B[x.bedId]?.code}`}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Issue date" required>
                <Input
                  type="date"
                  value={f.issueDate}
                  onChange={(e) => setF({ ...f, issueDate: e.target.value })}
                />
              </Field>
              <Field label="Due date" required>
                <Input
                  type="date"
                  min={f.issueDate}
                  value={f.dueDate}
                  onChange={(e) => setF({ ...f, dueDate: e.target.value })}
                />
              </Field>
            </div>
          </Card>
          <Card title="Line items">
            <div className="space-y-2">
              {lines.map((l) => (
                <div
                  key={l.id}
                  className="grid grid-cols-[1fr_72px_110px_100px_44px] gap-2 items-center"
                >
                  <Input
                    aria-label="Description"
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) =>
                      setLine(l.id, "description", e.target.value)
                    }
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    min="1"
                    value={l.qty}
                    onChange={(e) => setLine(l.id, "qty", e.target.value)}
                  />
                  <Input
                    aria-label="Unit price"
                    type="number"
                    min="0"
                    value={l.unitPrice}
                    onChange={(e) => setLine(l.id, "unitPrice", e.target.value)}
                  />
                  <span className="tabular-nums text-right">
                    {inr(Math.round((+l.qty || 0) * (+l.unitPrice || 0)))}
                  </span>
                  <button
                    aria-label="Remove item"
                    disabled={lines.length === 1}
                    onClick={() => setLines(lines.filter((x) => x.id !== l.id))}
                    className="grid place-items-center h-11 rounded-lg hover:bg-[#FDEDEE] disabled:opacity-40"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setLines([...lines, line()])}
            >
              <Plus size={16} /> Add item
            </Button>
          </Card>
          <Field label="Notes">
            <Textarea
              value={f.notes}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
            />
          </Field>
        </div>
        <Card title="Summary" className="h-fit">
          <dl className="space-y-2 tabular-nums">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{inr(subtotal)}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt>Discount (₹)</dt>
              <dd className="w-28">
                <Input
                  aria-label="Discount"
                  type="number"
                  min="0"
                  value={f.discount}
                  onChange={(e) => setF({ ...f, discount: e.target.value })}
                />
              </dd>
            </div>
            <div className="flex justify-between font-semibold border-t border-line pt-2">
              <dt>Total</dt>
              <dd>{inr(Math.max(0, total))}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              loading={busy === "issue"}
              disabled={!!busy}
              onClick={() => save(true)}
            >
              Issue invoice
            </Button>
            <Button
              variant="secondary"
              loading={busy === "draft"}
              disabled={!!busy}
              onClick={() => save(false)}
            >
              Save draft
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

export default function InvoiceForm() {
  const { id } = useParams();
  const s = useSnapshot();
  return (
    <Gate s={s}>
      {(db) => {
        const bill = id ? bills(db).find((b) => b.id === id) : null;
        if (id && !bill)
          return (
            <Card>
              <Empty title="Record not found.">
                <Link className="text-primary" to="/admin/billing">
                  Back to billing
                </Link>
              </Empty>
            </Card>
          );
        if (bill && bill.state !== "draft")
          return (
            <Card>
              <Empty title="Issued invoices can’t be edited.">
                <Link className="text-primary" to={`/admin/billing/${id}`}>
                  Back to invoice
                </Link>
              </Empty>
            </Card>
          );
        return <Form db={db} bill={bill} />;
      }}
    </Gate>
  );
}
