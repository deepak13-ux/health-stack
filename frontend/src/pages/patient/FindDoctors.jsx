import { useState } from 'react';
import * as api from '../../api/api';
import { useRemote } from '../../useRemote';
import { RemoteData } from '../../components/RemoteData';
import { Button, Card, Field, Input, Modal, PageHeader, inr } from '../../components/ui';

function Booking({ doctor, onClose }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const slots = useRemote(() => api.getSlots(doctor.id, date), date);
  async function book() {
    setBusy(true); setError('');
    try { await api.bookAppointment({ doctorId: doctor.id, date, time }); setDone(true); }
    catch (e) { setError(e.message); slots.reload(); setTime(''); }
    finally { setBusy(false); }
  }
  return <Modal title={`Book ${doctor.name}`} onClose={onClose}>
    {done ? <><p role="status">Appointment booked.</p><Button className="mt-4" onClick={onClose}>Done</Button></> : <div className="space-y-4">
      {error && <p role="alert" className="text-[#A12B35]">{error}</p>}
      <Field label="Date"><Input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} /></Field>
      <p className="text-muted">Six 30-minute slots, 09:00–12:00 · Asia/Kolkata</p>
      <RemoteData state={slots}>{(rows) => <div className="grid grid-cols-3 gap-2">{rows.map((slot) => <Button key={slot.time}
        variant={time === slot.time ? 'primary' : 'secondary'} disabled={!slot.available} onClick={() => setTime(slot.time)}>
        {slot.time}
      </Button>)}</div>}</RemoteData>
      <p>Consultation fee: {inr(doctor.fee)}</p>
      <Button disabled={!time || busy || slots.loading} loading={busy} onClick={book}>Book appointment</Button>
    </div>}
  </Modal>;
}
export default function FindDoctors() {
  const doctors = useRemote(api.listDoctors);
  const [selected, setSelected] = useState(null);
  return <>
    <PageHeader title="Find a doctor" description="Choose a doctor and a morning appointment slot." />
    <RemoteData state={doctors}>{(rows) => rows.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map((doctor) => <Card key={doctor.id} title={doctor.name}>
        <p className="text-muted">{doctor.specialty}</p><p className="my-3">Consultation: {inr(doctor.fee)}</p>
        <Button onClick={() => setSelected(doctor)}>View slots & book</Button>
      </Card>)}
    </div> : <Card>No doctors available.</Card>}</RemoteData>
    {selected && <Booking doctor={selected} onClose={() => setSelected(null)} />}
  </>;
}
