import { useState } from "react";
import * as api from "../../api/api";
import { billBalance } from "../../lib/appointments";
import { RemoteData } from "../../components/RemoteData";
import { useRemote } from "../../useRemote";
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, inr } from "../../components/ui";
export default function Pharmacy() {
  const state = useRemote(api.getPharmacy);
  const [query, setQuery] = useState("");
  const [paying, setPaying] = useState(null);
  const [method, setMethod] = useState("Cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function pay() {
    if (busy) return;
    setBusy(true); setError("");
    try { await api.payBill(paying.id, method); setPaying(null); setNotice("Payment recorded."); state.reload(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <><PageHeader title="Pharmacy" description="Review patient prescriptions and record payment against the linked bill." />{notice && <p role="status" className="mb-4 text-primary">{notice}</p>}<Field label="Search prescriptions"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Patient name or prescription ID" /></Field>
    <div className="mt-4"><RemoteData state={state}>{(rows) => {
      const shown = rows.filter((r) => `${r.patientName} ${r.id}`.toLowerCase().includes(query.toLowerCase()));
      return shown.length ? <div className="grid xl:grid-cols-2 gap-4">{shown.map((r) => <Card key={r.id} title={r.patientName}><p className="text-muted mb-3">Prescription {r.id}</p><ul className="space-y-2">{r.items.map((m, i) => <li key={i}>{m.name} · Quantity {m.qty} · {m.dosage || "As directed"} · {m.frequency}</li>)}</ul>{!r.items.length && <p>No medicines prescribed.</p>}{r.notes && <p className="mt-3">{r.notes}</p>}{r.bill ? <div className="mt-4 border-t border-line pt-4 space-y-3"><p>{r.bill.number} · <Badge status={r.bill.status} /></p><p>Outstanding: {inr(billBalance(r.bill))}</p>{billBalance(r.bill) > 0 && <Button onClick={() => { setError(""); setPaying(r.bill); }}>Record payment</Button>}</div> : <p className="text-muted mt-4">No linked bill.</p>}</Card>)}</div> : <Empty title="No prescriptions match your search." />;
    }}</RemoteData></div>
    {paying && <Modal title={`Record payment · ${paying.number}`} onClose={() => { if (!busy) setPaying(null); }}><div className="space-y-4">{error && <p role="alert" className="text-[#A12B35]">{error}</p>}<p>Record the full outstanding amount of {inr(billBalance(paying))} after payment is received.</p><Field label="Payment method"><Select value={method} onChange={(e) => setMethod(e.target.value)}><option>Cash</option><option>Card</option><option>UPI</option></Select></Field><Button loading={busy} onClick={pay}>Confirm payment received</Button></div></Modal>}
  </>;
}
