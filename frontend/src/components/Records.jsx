import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { fmtDate, hospitalToday } from "../lib/clock.js";
import { inr } from "../lib/money.js";
import { billBalance, billLines, billPaid, displayId, isRunning } from "../lib/rules.js";
import { ButtonLink, EmptyState, StatusBadge } from "./ui.jsx";

export function RecordNotFound({ what = "record", backTo, backLabel }) {
  return (
    <div className="bg-white border border-line rounded-2xl">
      <EmptyState icon={FileQuestion} title="Record not found" action={<ButtonLink to={backTo} variant="secondary">{backLabel}</ButtonLink>}>
        This {what} doesn't exist or isn't available to your account.
      </EmptyState>
    </div>
  );
}

export function MedicineTable({ items, caption }) {
  if (!items.length) return <p className="text-muted">No medicines prescribed.</p>;
  return (
    <div className="overflow-x-auto -mx-1" role="region" aria-label={caption} tabIndex={0}>
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-xs leading-[18px] text-muted">
            <th scope="col" className="px-1 py-2 font-semibold">Medicine</th>
            <th scope="col" className="px-1 py-2 font-semibold text-right">Qty</th>
            <th scope="col" className="px-1 py-2 font-semibold">Dosage</th>
            <th scope="col" className="px-1 py-2 font-semibold">Frequency</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.medicineId} className="border-b border-line last:border-0">
              <td className="px-1 py-2">{m.name}</td>
              <td className="px-1 py-2 text-right tabular-nums">{m.qty}</td>
              <td className="px-1 py-2">{m.dosage}</td>
              <td className="px-1 py-2">{m.frequency}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrescriptionCard({ prescription, doctorName, visitDate, headingLevel = 3 }) {
  const today = hospitalToday();
  const running = isRunning(prescription, today);
  const H = `h${headingLevel}`;
  return (
    <article className="bg-white border border-line rounded-2xl p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <H className="font-semibold">{doctorName || "Prescription"}</H>
          <p className="text-xs text-muted tabular-nums">
            {displayId("RX", prescription.id)} · Prescribed {fmtDate(prescription.date)}{visitDate && visitDate !== prescription.date ? ` · Visit ${fmtDate(visitDate)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={running ? "running" : "expired"} />
          <p className="text-xs text-muted mt-1 tabular-nums">{running ? "Valid until" : "Ended"} {fmtDate(prescription.validUntil)}</p>
        </div>
      </div>
      {prescription.notes && <p className="bg-canvas rounded-[10px] p-3 whitespace-pre-wrap">{prescription.notes}</p>}
      <MedicineTable items={prescription.items} caption={`Medicines in prescription ${displayId("RX", prescription.id)}`} />
    </article>
  );
}

// Printable invoice sheet built from the stored bill. The stored total is authoritative.
export function InvoiceSheet({ bill, prescription, patient, visit }) {
  const lines = billLines(bill, prescription);
  return (
    <article className="print-reset bg-white border border-line rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Careflow Community Hospital</p>
          <p className="text-muted">Fictional demo hospital · Asia/Kolkata</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-muted">Bill</p>
          <p className="text-lg font-semibold tabular-nums">{displayId("B", bill.id)}</p>
          <p className="text-muted tabular-nums">Issued {fmtDate(bill.date)}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">Billed to</p>
          <p className="font-medium">{patient.name}</p>
          {patient.id && <p className="text-muted tabular-nums">{displayId("P", patient.id)}</p>}
          {patient.phone && <p className="text-muted tabular-nums">{patient.phone}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-muted">Visit</p>
          <p className="tabular-nums">{displayId("A", bill.appointmentId)}</p>
          {visit && <p className="text-muted">{visit}</p>}
        </div>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Bill line items" tabIndex={0}>
        <table className="w-full text-left">
          <caption className="sr-only">Line items for {displayId("B", bill.id)}</caption>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">Description</th>
              <th scope="col" className="py-2 px-3 font-semibold text-right">Qty</th>
              <th scope="col" className="py-2 px-3 font-semibold text-right">Rate</th>
              <th scope="col" className="py-2 pl-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-2 pr-3">{l.description}</td>
                <td className="py-2 px-3 text-right">{l.qty}</td>
                <td className="py-2 px-3 text-right">{inr(l.unitPricePaise)}</td>
                <td className="py-2 pl-3 text-right">{inr(l.qty * l.unitPricePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto max-w-xs space-y-1 tabular-nums">
        <div className="flex justify-between font-semibold text-base"><dt>Total</dt><dd>{inr(bill.totalPaise)}</dd></div>
        <div className="flex justify-between"><dt>Paid</dt><dd>{inr(billPaid(bill))}</dd></div>
        <div className="flex justify-between font-semibold border-t border-line pt-1"><dt>Outstanding</dt><dd>{inr(billBalance(bill))}</dd></div>
      </dl>
      <p className="text-muted border-t border-line pt-4">
        {bill.status === "paid"
          ? `Paid${bill.method ? ` by ${bill.method}` : ""}${bill.paidDate ? ` on ${fmtDate(bill.paidDate)}` : ""}.`
          : "Payment pending. Pay at the hospital pharmacy desk."}
        {" "}No tax applied.
      </p>
    </article>
  );
}

export function BillLink({ bill }) {
  return <Link to={`/billing/${bill.id}`} className="font-semibold text-primary hover:underline tabular-nums">{displayId("B", bill.id)}</Link>;
}
