import { useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../../api/index.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { bookingDates, fmtDate, hospitalToday, relativeDay } from "../../lib/clock.js";
import { inr } from "../../lib/money.js";
import { BookingDialog } from "../../components/BookingDialog.jsx";
import { RecordNotFound } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, ButtonLink, Card, DefinitionList, PageHeader, PersonIdentity } from "../../components/ui.jsx";

// Real availability for the booking window, one request per date.
function Availability({ doctorId, onPick }) {
  const today = hospitalToday();
  const dates = bookingDates(today);
  const state = useRemote(() => Promise.all(dates.map((d) => api.getSlots(doctorId, d).then((slots) => ({ date: d, slots })))), `${doctorId}|${today}`);
  return (
    <Card title="Available slots" action={<Button size="sm" variant="secondary" onClick={state.reload}>Refresh</Button>}>
      <RemoteData state={state} rows={4}>
        {(days) => (
          <ul className="divide-y divide-line">
            {days.map(({ date, slots }) => (
              <li key={date} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="sm:w-40 font-medium">{relativeDay(date, today)} <span className="text-muted font-normal text-xs">{fmtDate(date, { year: false })}</span></span>
                {slots.length ? (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((t) => <Button key={t} size="sm" variant="secondary" className="tabular-nums" aria-label={`Book ${relativeDay(date, today)} at ${t}`} onClick={() => onPick(date, t)}>{t}</Button>)}
                  </div>
                ) : <span className="text-muted">No available slots</span>}
              </li>
            ))}
          </ul>
        )}
      </RemoteData>
    </Card>
  );
}

export function DoctorProfile() {
  const { doctorId } = useParams();
  const state = useRemote(() => api.getDoctor(doctorId), doctorId);
  const [booking, setBooking] = useState(null);
  useTitle(state.data?.name || "Doctor profile");
  if (state.error?.status === 404 || state.error?.status === 422) return <RecordNotFound what="doctor" backTo="/doctors" backLabel="Back to doctors" />;
  return (
    <RemoteData state={state} rows={5}>
      {(d) => (
        <>
          <PageHeader title={d.name} description={d.department} primary={<Button onClick={() => setBooking({})}>Book appointment</Button>} secondary={<ButtonLink variant="secondary" to="/doctors">All doctors</ButtonLink>} />
          <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
            <Card title="Profile">
              <div className="mb-4"><PersonIdentity size="lg" name={d.name} secondary={d.department} /></div>
              <DefinitionList items={[
                ["Department", d.department],
                ["Licence number", <span key="l" className="tabular-nums">{d.licenseNo}</span>],
                ["Consultation fee", <span key="f" className="tabular-nums">{inr(d.feePaise)}</span>],
                ["Visit length", "30 minutes"],
              ]} />
            </Card>
            <Availability doctorId={d.id} onPick={(date, time) => setBooking({ date, time })} />
          </div>
          {booking && <BookingDialog initialDoctorId={d.id} initialDate={booking.date} initialTime={booking.time} onClose={() => setBooking(null)} />}
        </>
      )}
    </RemoteData>
  );
}
