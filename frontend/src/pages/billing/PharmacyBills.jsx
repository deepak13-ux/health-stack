import { useState } from "react";
import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import * as api from "../../api/index.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { fmtDate } from "../../lib/clock.js";
import { inr } from "../../lib/money.js";
import { displayId } from "../../lib/rules.js";
import { DataTable } from "../../components/DataTable.jsx";
import { BillLink } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, Card, EmptyState, MetricCard, PageHeader, SearchInput } from "../../components/ui.jsx";
import { RecordPaymentDialog } from "./RecordPaymentDialog.jsx";

export function PharmacyBills() {
  useTitle("Pending bills");
  const toast = useToast();
  const state = useRemote(api.pendingBills, "pending-bills");
  const [q, setQ] = useQueryState({ q: "" });
  const [paying, setPaying] = useState(null);
  const match = (b) => {
    const s = q.q.trim().toLowerCase();
    return !s || [b.patient.name, b.patient.phone, displayId("B", b.id), String(b.id)].some((v) => (v || "").toLowerCase().includes(s));
  };
  const columns = [
    { key: "bill", header: "Bill", sortValue: (b) => b.id, render: (b) => <BillLink bill={b} /> },
    { key: "patient", header: "Patient", sortValue: (b) => b.patient.name, render: (b) => <>{b.patient.name}<p className="text-xs text-muted tabular-nums">{displayId("P", b.patient.id)} · {b.patient.phone}</p></> },
    { key: "date", header: "Issued", sortValue: (b) => b.date, render: (b) => <span className="tabular-nums">{fmtDate(b.date)}</span> },
    { key: "rx", header: "Prescription", render: (b) => b.prescription ? `${b.prescription.items.length} ${b.prescription.items.length === 1 ? "medicine" : "medicines"}` : <span className="text-muted">None</span> },
    { key: "amount", header: "Amount due", align: "right", sortValue: (b) => b.totalPaise, render: (b) => <span className="font-semibold">{inr(b.totalPaise)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, render: (b) => (
      <div className="flex gap-2 justify-end">
        <Link to={`/billing/${b.id}`} className="h-9 px-3 inline-flex items-center rounded-[10px] text-primary font-medium hover:bg-surface-blue" aria-label={`View ${displayId("B", b.id)}`}>View</Link>
        <Button size="sm" onClick={() => setPaying(b)} aria-label={`Record payment for ${displayId("B", b.id)}`}>Record payment</Button>
      </div>
    ) },
  ];
  return (
    <>
      <PageHeader title="Pending bills" description="Dispense prescribed medicines and record payment when it's received." />
      <RemoteData state={state} rows={6}>
        {(bills) => {
          const rows = bills.filter(match);
          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <MetricCard label="Pending bills" value={bills.length} hint="Awaiting payment" />
                <MetricCard label="Outstanding" value={inr(bills.reduce((s, b) => s + b.totalPaise, 0))} hint="Sum of pending bills" />
              </div>
              <Card bodyClass="pb-1">
                <div className="flex flex-col md:flex-row gap-3 px-5 py-4 border-b border-line">
                  <SearchInput label="Search pending bills" placeholder="Patient name, phone or bill ID" value={q.q} onChange={(v) => setQ({ q: v })} className="md:w-96" />
                  {q.q && <Button variant="ghost" onClick={() => setQ({ q: "" })}>Clear filters (1)</Button>}
                </div>
                <DataTable caption="Pending bills" columns={columns} rows={rows} defaultSort="date"
                  renderCard={(b) => (
                    <div className="border border-line rounded-xl p-4 space-y-2">
                      <div className="flex justify-between gap-2"><BillLink bill={b} /><span className="font-semibold tabular-nums">{inr(b.totalPaise)}</span></div>
                      <p>{b.patient.name} <span className="text-muted tabular-nums">· {b.patient.phone}</span></p>
                      <Button size="sm" className="w-full" onClick={() => setPaying(b)}>Record payment</Button>
                    </div>
                  )}
                  empty={bills.length
                    ? <EmptyState icon={Receipt} title="No pending bills match this search." action={<Button variant="secondary" onClick={() => setQ({ q: "" })}>Clear filters</Button>} />
                    : <EmptyState icon={Receipt} title="No pending bills.">Bills appear here when a doctor completes a visit.</EmptyState>} />
              </Card>
            </>
          );
        }}
      </RemoteData>
      {paying && <RecordPaymentDialog bill={paying} onClose={() => setPaying(null)} onDone={() => { setPaying(null); toast("Payment recorded."); state.reload(); }} />}
    </>
  );
}
