import { useId } from "react";
import * as api from "../api/index.js";
import { useRemote } from "../hooks/useRemote.js";
import { bookingDates, fmtDate, hospitalToday, relativeDay } from "../lib/clock.js";
import { Button } from "./ui.jsx";

const chip = (selected) =>
  `min-h-11 px-3 rounded-[10px] border font-medium tabular-nums transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 ${selected ? "bg-primary border-primary text-white" : "bg-white border-control hover:bg-surface-blue"}`;

// A radio group rendered as chips; arrow keys move between options natively.
function ChipGroup({ legend, name, options, value, onChange, error, columns = "grid-cols-2 sm:grid-cols-4" }) {
  const errId = useId();
  return (
    <fieldset aria-describedby={error ? errId : undefined}>
      <legend className="text-xs leading-[18px] font-semibold mb-1">{legend}<span className="text-danger-ink" aria-hidden="true"> *</span></legend>
      <div className={`grid ${columns} gap-2`}>
        {options.map((o) => (
          <label key={o.value} className="relative">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className={`${chip(value === o.value)} flex flex-col items-center justify-center py-1.5`}>
              <span>{o.label}</span>
              {o.sub && <span className={`text-xs font-normal ${value === o.value ? "text-white/85" : "text-muted"}`}>{o.sub}</span>}
            </span>
          </label>
        ))}
      </div>
      {error && <p id={errId} className="text-xs text-danger-ink mt-1">{error}</p>}
    </fieldset>
  );
}

export function DateChoice({ value, onChange, error }) {
  const today = hospitalToday();
  const options = bookingDates(today).map((d) => ({ value: d, label: relativeDay(d, today), sub: fmtDate(d, { year: false }) }));
  return <ChipGroup legend="Date" name="booking-date" options={options} value={value} onChange={onChange} error={error} />;
}

// Available start times for one doctor on one date, straight from the server.
export function SlotPicker({ doctorId, date, value, onChange, error, refreshKey = 0 }) {
  const slots = useRemote(() => (doctorId && date ? api.getSlots(doctorId, date) : Promise.resolve(null)), `${doctorId}|${date}|${refreshKey}`);
  if (!doctorId || !date) return <p className="text-muted">Choose a doctor and date to see available times.</p>;
  if (slots.loading) return <p role="status" aria-busy="true" className="text-muted">Checking available times…</p>;
  if (slots.error) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 bg-danger-bg text-danger-ink rounded-[10px] p-3">
        <span>{slots.error.message}</span>
        <Button size="sm" variant="secondary" onClick={slots.reload}>Retry</Button>
      </div>
    );
  }
  if (!slots.data.length) return <p className="bg-neutral-bg text-neutral-ink rounded-[10px] p-3">No available slots. Choose another doctor or date.</p>;
  return (
    <ChipGroup legend="Available time (30 minutes, Asia/Kolkata)" name="booking-time" columns="grid-cols-3 sm:grid-cols-6"
      options={slots.data.map((t) => ({ value: t, label: t }))} value={value} onChange={onChange} error={error} />
  );
}
