import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import * as admin from "../../api/admin";
import { useSnapshot } from "../../hooks";
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
  Textarea,
  fmtDate,
  inr,
} from "../../components/ui";
import { ConfirmDialog, Err, Gate, useToast } from "../../components/ui2";
import {
  balanceOf,
  bills,
  billStatus,
  fmtDT,
  sumPaid,
  toLocalInput,
} from "../../lib/selectors";
import { uid } from "../../api/mockDb";

function PayModal({ bill, onClose, onDone }) {
  const key = useRef(uid("idem"));
  const [amount, setAmount] = useState(balanceOf(bill));
  const [method, setMethod] = useState("UPI");
  const [paidAt, setPaidAt] = useState(toLocalInput());
  const [reference, setReference] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await admin.recordPayment(bill.id, {
        amount: +amount,
        method,
        reference,
        paidAt,
        idempotencyKey: key.current,
      });
      onDone("Payment recorded.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Record payment" onClose={onClose}>
      <div className="space-y-3">
        <Err msg={err} />
        <Field
          label="Amount (₹)"
          required
          helper={`Outstanding: ${inr(balanceOf(bill))}`}
        >
          <Input
            type="number"
            min="1"
            max={balanceOf(bill)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Method">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Cash</option>
            <option>Card</option>
            <option>UPI</option>
          </Select>
        </Field>
        <Field label="Paid at">
          <Input
            type="datetime-local"
            max={toLocalInput()}
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </Field>
        <Field label="Reference (optional)">
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            Record payment
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = useSnapshot();
  const [modal, setModal] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [toast, show] = useToast();
  const act = async (fn, msg) => {
    setErr("");
    try {
      await fn();
      setModal("");
      show(msg);
      s.reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Gate s={s}>
      {(db) => {
        const b = bills(db).find((x) => x.id === id);
        if (!b)
          return (
            <Card>
              <Empty title="Record not found.">
                <Link className="text-primary" to="/admin/billing">
                  Back to billing
                </Link>
              </Empty>
            </Card>
          );
        const pat = db.users.find((u) => u.id === b.patientId);
        const snap = b.patientSnapshot || pat;
        const hosp = b.hospitalSnapshot || db.settings;
        const st = billStatus(b);
        return (
          <>
            {toast}
            <div className="flex flex-wrap justify-between gap-3 mb-6 no-print">
              <div className="flex items-center gap-3">
                <h1 className="text-[28px] font-semibold tabular-nums">
                  {b.number}
                </h1>
                <Badge status={st} />
              </div>
              <div className="flex flex-wrap gap-2">
                {b.state === "draft" && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => nav(`/admin/billing/${b.id}/edit`)}
                    >
                      Edit draft
                    </Button>
                    <Button
                      onClick={() =>
                        act(() => admin.issueInvoice(b.id), "Invoice issued.")
                      }
                    >
                      Issue invoice
                    </Button>
                    <Button variant="danger" onClick={() => setModal("delete")}>
                      Delete draft
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer size={16} /> Print invoice
                </Button>
                {b.state === "issued" && balanceOf(b) > 0 && (
                  <Button onClick={() => setModal("pay")}>
                    Record payment
                  </Button>
                )}
                {b.state === "issued" && b.payments.length === 0 && (
                  <Button variant="danger" onClick={() => setModal("void")}>
                    Void
                  </Button>
                )}
              </div>
            </div>
            <Err msg={err} />
            <div className="bg-white border border-line rounded-2xl p-8 max-w-3xl">
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-xl font-semibold">{hosp.name}</p>
                  <p className="text-muted">
                    {hosp.address}
                    <br />
                    {hosp.phone}
                  </p>
                </div>
                <div className="text-right tabular-nums">
                  <p className="font-semibold">{b.number}</p>
                  <p className="text-muted">
                    Issued {fmtDate(b.issueDate)}
                    <br />
                    Due {fmtDate(b.dueDate)}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-muted">Billed to</p>
              <p className="font-medium">{snap?.name}</p>
              <p className="text-muted mb-6">
                {snap?.mrn} · {snap?.phone}
              </p>
              <Table
                caption="Line items"
                heads={["Item", "Qty", "Rate", "Amount"]}
              >
                {b.lines.map((l, i) => (
                  <tr key={i} className="tabular-nums">
                    <td>{l.description}</td>
                    <td>{l.qty}</td>
                    <td>{inr(l.unitPrice)}</td>
                    <td>{inr(Math.round(l.qty * l.unitPrice))}</td>
                  </tr>
                ))}
              </Table>
              <dl className="mt-4 ml-auto w-64 space-y-1 tabular-nums">
                <div className="flex justify-between">
                  <dt>Discount</dt>
                  <dd>{inr(b.discount)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Total</dt>
                  <dd>{inr(b.total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Paid</dt>
                  <dd>{inr(sumPaid(b))}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Outstanding</dt>
                  <dd>{inr(balanceOf(b))}</dd>
                </div>
              </dl>
              {b.notes && <p className="mt-4 text-muted">Notes: {b.notes}</p>}
              {b.state === "void" && (
                <p className="mt-4 text-[#A12B35]">Void: {b.voidReason}</p>
              )}
            </div>
            <Card title="Payment history" className="max-w-3xl mt-6 no-print">
              {b.payments.length === 0 ? (
                <Empty title="No payments recorded." />
              ) : (
                <Table
                  caption="Payments"
                  heads={["Date", "Method", "Reference", "Amount"]}
                >
                  {b.payments.map((p) => (
                    <tr key={p.id}>
                      <td>{fmtDT(p.paidAt)}</td>
                      <td>{p.method}</td>
                      <td>{p.reference || "—"}</td>
                      <td className="tabular-nums">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
            {modal === "pay" && (
              <PayModal
                bill={b}
                onClose={() => setModal("")}
                onDone={(m) => {
                  setModal("");
                  show(m);
                  s.reload();
                }}
              />
            )}
            {modal === "void" && (
              <Modal title="Void invoice" onClose={() => setModal("")}>
                <Field label="Reason" required>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </Field>
                <Err msg={err} />
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    autoFocus
                    variant="secondary"
                    onClick={() => setModal("")}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() =>
                      act(
                        () => admin.voidInvoice(b.id, reason),
                        "Invoice voided.",
                      )
                    }
                  >
                    Void invoice
                  </Button>
                </div>
              </Modal>
            )}
            {modal === "delete" && (
              <ConfirmDialog
                title="Delete draft?"
                danger
                confirmLabel="Delete draft"
                onCancel={() => setModal("")}
                onConfirm={async () => {
                  try {
                    await admin.deleteDraft(b.id);
                    nav("/admin/billing");
                  } catch (e) {
                    setErr(e.message);
                    setModal("");
                  }
                }}
              >
                This draft will be removed permanently.
              </ConfirmDialog>
            )}
          </>
        );
      }}
    </Gate>
  );
}
