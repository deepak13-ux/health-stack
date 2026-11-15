import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import * as api from "../../api/index.js";
import { useRemote } from "../../hooks/useRemote.js";
import { inr } from "../../lib/money.js";
import { CONSULTATION_FEE_PAISE, estimateVisitTotal, validateVisit } from "../../lib/rules.js";
import { Dialog } from "../../components/Dialog.jsx";
import { Button, Field, InlineError, Input, Select, Textarea } from "../../components/ui.jsx";

const blankItem = () => ({ key: Math.random().toString(36).slice(2), medicineId: "", qty: "1", dosage: "", frequency: "Daily" });

// Doctor records notes + medicines; the server creates the prescription and bill together.
export function CompleteVisitDialog({ appointment, onClose, onDone }) {
  const medicines = useRemote(api.listMedicines, "medicines");
  const byId = new Map((medicines.data || []).map((m) => [m.id, m]));
  const [notes, setNotes] = useState("");
  const [durationDays, setDurationDays] = useState("7");
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const dirty = notes !== "" || durationDays !== "7" || items.length > 0;

  const update = (i, patch) => { setItems((all) => all.map((it, j) => (j === i ? { ...it, ...patch } : it))); setErrors({}); setFormError(null); };

  const submit = async (e) => {
    e.preventDefault();
    const next = validateVisit({ durationDays, items });
    setErrors(next);
    setFormError(null);
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      setFormError("Check the highlighted fields.");
      formRef.current.querySelector(`[data-field="${firstKey}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      onDone(await api.completeAppointment(appointment.id, { notes, durationDays, items }));
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Complete visit" description={`${appointment.patient.name} · ${appointment.time}`} size="xl" onClose={onClose} dirty={dirty} busy={busy}
      footer={({ requestClose }) => (
        <>
          <Button variant="secondary" onClick={requestClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="complete-form" pending={busy} pendingLabel="Saving…" disabled={!medicines.data}>Complete visit & create bill</Button>
        </>
      )}>
      <form id="complete-form" ref={formRef} onSubmit={submit} noValidate className="space-y-5">
        <InlineError>{formError}</InlineError>
        <Field label="Visit notes" helper="Plain text. Shown to the patient with the prescription.">
          <Textarea value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field label="Prescription valid for (days)" required error={errors.durationDays} className="max-w-60">
          <Input data-field="durationDays" type="number" inputMode="numeric" min="1" max="365" value={durationDays} onChange={(e) => { setDurationDays(e.target.value); setErrors({}); }} />
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold mb-2">Medicines</legend>
          {medicines.error && <InlineError>{medicines.error.message}</InlineError>}
          {!items.length && <p className="text-muted">No medicines added. The bill will contain the consultation fee only.</p>}
          {items.map((item, i) => {
            const med = byId.get(Number(item.medicineId));
            return (
              <div key={item.key} className="border border-line rounded-xl p-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_112px_auto] gap-3 items-start">
                <Field label="Medicine" required error={errors[`items.${i}.medicineId`]} helper={med ? `${inr(med.pricePaise)} each` : undefined} className="sm:col-span-2">
                  <Select data-field={`items.${i}.medicineId`} value={item.medicineId} onChange={(e) => update(i, { medicineId: e.target.value })}>
                    <option value="">{medicines.loading ? "Loading…" : "Select medicine"}</option>
                    {(medicines.data || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Select>
                </Field>
                <Field label="Qty" required error={errors[`items.${i}.qty`]}>
                  <Input data-field={`items.${i}.qty`} type="number" inputMode="numeric" min="1" value={item.qty} onChange={(e) => update(i, { qty: e.target.value })} />
                </Field>
                <Field label="Dosage" required error={errors[`items.${i}.dosage`]} className="sm:row-start-2">
                  <Input data-field={`items.${i}.dosage`} maxLength={50} placeholder="1 tablet after food" value={item.dosage} onChange={(e) => update(i, { dosage: e.target.value })} />
                </Field>
                <Field label="Frequency" required error={errors[`items.${i}.frequency`]} className="sm:row-start-2 sm:col-span-2">
                  <Input data-field={`items.${i}.frequency`} maxLength={50} value={item.frequency} onChange={(e) => update(i, { frequency: e.target.value })} />
                </Field>
                <Button variant="ghost" className="sm:mt-[22px] sm:col-start-4 sm:row-start-1" aria-label={`Remove medicine ${i + 1}${med ? ` (${med.name})` : ""}`} onClick={() => { setItems((all) => all.filter((_, j) => j !== i)); setErrors({}); }}>
                  <Trash2 size={18} aria-hidden="true" />
                </Button>
              </div>
            );
          })}
          <Button variant="secondary" disabled={!medicines.data} onClick={() => setItems((all) => [...all, blankItem()])}><Plus size={18} aria-hidden="true" /> Add medicine</Button>
        </fieldset>

        <div className="bg-surface-blue rounded-xl p-4 tabular-nums" aria-live="polite">
          <div className="flex justify-between"><span>Consultation fee</span><span>{inr(CONSULTATION_FEE_PAISE)}</span></div>
          <div className="flex justify-between"><span>Medicines</span><span>{inr(estimateVisitTotal(items, byId) - CONSULTATION_FEE_PAISE)}</span></div>
          <div className="flex justify-between font-semibold border-t border-blue-border mt-2 pt-2"><span>Estimated bill</span><span>{inr(estimateVisitTotal(items, byId))}</span></div>
          <p className="text-xs text-muted mt-1">The server calculates the final amount from current medicine prices.</p>
        </div>
      </form>
    </Dialog>
  );
}
