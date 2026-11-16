import { Receipt } from "lucide-react";
import * as api from "../../api/index.js";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { fmtDate } from "../../lib/clock.js";
import { inr } from "../../lib/money.js";
import { billBalance, billPaid } from "../../lib/rules.js";
import { DataTable } from "../../components/DataTable.jsx";
import { BillLink } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, Card, EmptyState, MetricCard, PageHeader, Select, StatusBadge } from "../../components/ui.jsx";

export function PatientBills() {
  useTitle("Billing");
  const state = useRemote(api.myAppointments, "my-appointments");
  const [q, setQ] = useQueryState({ status: "" });
  return (
    <>
      <PageHeader title="Billing" description="Bills from completed visits. Pay at the hospital pharmacy desk." />
      <RemoteData state={state} rows={6}>
        {(appts) => {
          const bills = appts.filter((a) => a.bill).map((a) => ({ ...a.bill, doctorName: a.doctorName, visitDate: a.date }));
          const rows = bills.filter((b) => !q.status || b.status === q.status);
          const columns = [
            { key: "bill", header: "Bill", sortValue: (b) => b.id, render: (b) => <BillLink bill={b} /> },
            { key: "date", header: "Issued", sortValue: (b) => b.date, render: (b) => <span className="tabular-nums">{fmtDate(b.date)}</span> },
            { key: "doctor", header: "Visit", sortValue: (b) => b.doctorName, render: (b) => <>{b.doctorName}<p className="text-xs text-muted tabular-nums">{fmtDate(b.visitDate)}</p></> },
            { key: "total", header: "Total", align: "right", sortValue: (b) => b.totalPaise, render: (b) => inr(b.totalPaise) },
            { key: "balance", header: "Balance", align: "right", sortValue: billBalance, render: (b) => inr(billBalance(b)) },
            { key: "status", header: "Status", sortValue: (b) => b.status, render: (b) => <StatusBadge status={b.status} /> },
          ];
          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <MetricCard label="Billed" value={inr(bills.reduce((s, b) => s + b.totalPaise, 0))} hint={`${bills.length} bills`} />
                <MetricCard label="Paid" value={inr(bills.reduce((s, b) => s + billPaid(b), 0))} hint="Recorded payments" />
                <MetricCard label="Outstanding" value={inr(bills.reduce((s, b) => s + billBalance(b), 0))} hint={`${bills.filter((b) => b.status === "unpaid").length} unpaid`} />
              </div>
              <Card bodyClass="pb-1">
                <div className="flex flex-wrap gap-3 items-center px-5 py-4 border-b border-line">
                  <label htmlFor="bill-status" className="text-xs font-semibold">Status</label>
                  <Select id="bill-status" value={q.status} onChange={(e) => setQ({ status: e.target.value })} className="w-44">
                    <option value="">All</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </Select>
                  {q.status && <Button variant="ghost" onClick={() => setQ({ status: "" })}>Clear filters (1)</Button>}
                </div>
                <DataTable caption="Your bills" columns={columns} rows={rows} defaultSort="date" defaultDir="desc"
                  renderCard={(b) => (
                    <div className="border border-line rounded-xl p-4 space-y-1">
                      <div className="flex justify-between gap-2"><BillLink bill={b} /><StatusBadge status={b.status} /></div>
                      <p className="text-muted">{b.doctorName} · {fmtDate(b.visitDate)}</p>
                      <p className="tabular-nums">Total {inr(b.totalPaise)} · Balance <strong>{inr(billBalance(b))}</strong></p>
                    </div>
                  )}
                  empty={bills.length
                    ? <EmptyState icon={Receipt} title="No bills match these filters." action={<Button variant="secondary" onClick={() => setQ({ status: "" })}>Clear filters</Button>} />
                    : <EmptyState icon={Receipt} title="No bills yet.">A bill is created when your doctor completes a visit.</EmptyState>} />
              </Card>
            </>
          );
        }}
      </RemoteData>
    </>
  );
}
