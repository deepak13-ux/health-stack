import * as api from "../../api/index.js";
import { inr } from "../../lib/money.js";
import { billBalance, displayId } from "../../lib/rules.js";
import { ConfirmDialog } from "../../components/Dialog.jsx";

// The server records the full outstanding amount as a cash payment and rejects a
// second payment on the same bill, so a double submit can't record twice.
export function RecordPaymentDialog({ bill, onClose, onDone }) {
  return (
    <ConfirmDialog title={`Record payment · ${displayId("B", bill.id)}`} confirmLabel={`Record ${inr(billBalance(bill))} received`} pendingLabel="Recording…"
      onClose={onClose}
      onConfirm={async () => { await api.recordPayment(bill.id); onDone(); }}>
      <dl className="bg-surface-blue rounded-xl p-4 space-y-1 tabular-nums">
        <div className="flex justify-between"><dt>Patient</dt><dd className="font-medium">{bill.patient.name}</dd></div>
        <div className="flex justify-between"><dt>Amount</dt><dd className="font-semibold">{inr(billBalance(bill))}</dd></div>
        <div className="flex justify-between"><dt>Method</dt><dd>Cash</dd></div>
      </dl>
      <p className="text-muted">Confirm only after the full amount has been received. The bill will be marked as paid today; partial payments aren't supported.</p>
    </ConfirmDialog>
  );
}
