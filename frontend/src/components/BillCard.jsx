import { Printer } from "lucide-react";
import { Badge, Button, inr } from "./ui";

export default function BillCard({ bill, onPay }) {
  return (
    <div className="border border-line rounded-2xl bg-white p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-semibold tabular-nums">{bill.number}</p>
          <p className="text-xs text-muted">
            Careflow Community Hospital ·{" "}
            {new Date(bill.createdAt).toLocaleString("en-IN")}
          </p>
        </div>
        <Badge status={bill.status} />
      </div>
      <table className="w-full text-left mb-4">
        <thead>
          <tr className="text-xs text-muted border-b border-line">
            <th className="py-1">Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((l, i) => (
            <tr key={i} className="border-b border-line tabular-nums">
              <td className="py-2">{l.description}</td>
              <td>{l.qty}</td>
              <td>{inr(l.unitPrice)}</td>
              <td className="text-right">{inr(l.qty * l.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold tabular-nums">
            <td colSpan={3} className="pt-3">
              Total
            </td>
            <td className="pt-3 text-right">{inr(bill.total)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex gap-2 no-print">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print
        </Button>
        {bill.status === "unpaid" && onPay && (
          <Button onClick={() => onPay(bill)}>Pay {inr(bill.total)}</Button>
        )}
      </div>
    </div>
  );
}
