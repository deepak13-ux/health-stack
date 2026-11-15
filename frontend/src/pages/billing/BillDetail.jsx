import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import * as api from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { fmtDate } from "../../lib/clock.js";
import { billBalance, displayId } from "../../lib/rules.js";
import { InvoiceSheet, RecordNotFound } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, ButtonLink, Card, PageHeader, StatusBadge } from "../../components/ui.jsx";
import { RecordPaymentDialog } from "./RecordPaymentDialog.jsx";

// Patients read the bill from their visits; the pharmacy desk from the pending list.
async function loadBill(role, billId, user) {
  if (role === "pharmacist") {
    const bill = (await api.pendingBills()).find((b) => String(b.id) === billId);
    return bill && { bill, prescription: bill.prescription, patient: bill.patient, visit: null };
  }
  const visit = (await api.myAppointments()).find((a) => a.bill && String(a.bill.id) === billId);
  return visit && {
    bill: visit.bill,
    prescription: visit.prescription,
    patient: { id: user.userId, name: user.name },
    visit: `${visit.doctorName} · ${fmtDate(visit.date)}, ${visit.time}`,
  };
}

export function BillDetail() {
  const { billId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  useTitle(displayId("B", billId));
  const state = useRemote(() => loadBill(user.role, billId, user).then((r) => r ?? false), `${user.role}|${billId}`);
  const [paying, setPaying] = useState(false);
  const isDesk = user.role === "pharmacist";

  return (
    <RemoteData state={state} rows={8}>
      {(found) => {
        if (!found) {
          return <RecordNotFound what={isDesk ? "pending bill (it may already be paid)" : "bill"} backTo="/billing" backLabel={isDesk ? "Back to pending bills" : "Back to billing"} />;
        }
        const { bill, prescription } = found;
        return (
          <>
            <div className="no-print">
              <PageHeader title={displayId("B", bill.id)} description={`Issued ${fmtDate(bill.date, { weekday: true })}`}
                primary={isDesk && billBalance(bill) > 0 ? <Button onClick={() => setPaying(true)}>Record payment</Button> : null}
                secondary={<Button variant="secondary" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> Print bill</Button>}>
                <div className="mb-2"><StatusBadge status={bill.status} /></div>
              </PageHeader>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start print:block">
              <InvoiceSheet {...found} />
              <div className="no-print space-y-4">
                {prescription && (
                  <Card title={isDesk ? "Medicines to dispense" : "Prescription"}>
                    {prescription.items.length ? (
                      <ul className="divide-y divide-line">
                        {prescription.items.map((m) => (
                          <li key={m.medicineId} className="py-2">
                            <p className="flex justify-between gap-3"><span className="font-medium">{m.name}</span><span className="tabular-nums whitespace-nowrap">× {m.qty}</span></p>
                            <p className="text-muted">{m.dosage} · {m.frequency}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-muted">No medicines prescribed.</p>}
                    {prescription.notes && <p className="mt-3 bg-canvas rounded-[10px] p-3 whitespace-pre-wrap">{prescription.notes}</p>}
                  </Card>
                )}
                <ButtonLink variant="secondary" to="/billing" className="w-full">{isDesk ? "Back to pending bills" : "Back to billing"}</ButtonLink>
              </div>
            </div>
            {paying && (
              <RecordPaymentDialog bill={bill} onClose={() => setPaying(false)}
                onDone={() => { setPaying(false); toast(`Payment recorded for ${displayId("B", bill.id)}.`); navigate("/billing"); }} />
            )}
          </>
        );
      }}
    </RemoteData>
  );
}
