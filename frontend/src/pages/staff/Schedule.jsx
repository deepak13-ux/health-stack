import { useState } from 'react';
import * as api from '../../api/api';
import { useRemote } from '../../useRemote';
import { RemoteData } from '../../components/RemoteData';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Table, Textarea } from '../../components/ui';

function Prescription({ appointment, onClose, onDone }) {
  const medicines = useRemote(api.listMedicines);
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [durationDays, setDays] = useState(7);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function update(index, field, value) { setItems(items.map((row, i) => i === index ? { ...row, [field]: value } : row)); }
  async function complete(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.completeAppointment(appointment.id, { notes, durationDays: +durationDays, items }); onDone(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <Modal wide title={`Prescription · ${appointment.patientName}`} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={complete} className="space-y-4">
      {error && <p role="alert" className="text-[#A12B35]">{error}</p>}
      <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <Field label="Prescription duration (days)"><Input type="number" min="1" max="365" required value={durationDays} onChange={(e) => setDays(e.target.value)} /></Field>
      <RemoteData state={medicines}>{(rows) => <>
        {items.map((item, i) => <div key={i} className="grid sm:grid-cols-2 gap-2 border border-line rounded-xl p-3">
          <Field label="Medicine"><Select required value={item.medicineId} onChange={(e) => update(i, 'medicineId', +e.target.value)}>
            <option value="">Select medicine</option>{rows.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select></Field>
          <Field label="Quantity"><Input type="number" min="1" required value={item.qty} onChange={(e) => update(i, 'qty', +e.target.value)} /></Field>
          <Field label="Dosage"><Input required maxLength={50} placeholder="After food" value={item.dosage} onChange={(e) => update(i, 'dosage', e.target.value)} /></Field>
          <Field label="Frequency"><Input required maxLength={50} value={item.frequency} onChange={(e) => update(i, 'frequency', e.target.value)} /></Field>
          <Button type="button" variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>Remove medicine</Button>
        </div>)}
        <Button type="button" variant="secondary" onClick={() => setItems([...items, { medicineId: '', qty: 1, dosage: '', frequency: 'Daily' }])}>Add medicine</Button>
      </>}</RemoteData>
      <p className="text-muted">The bill includes ₹200 consultation plus the prescribed medicines.</p>
      <Button type="submit" loading={busy}>Complete visit & create bill</Button>
    </form>
  </Modal>;
}
export default function Schedule() {
  const state = useRemote(api.listAppointments);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function start(appointment) {
    setBusy(true); setError('');
    try { await api.startAppointment(appointment.id); state.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <><PageHeader title="Today's patients" description="Start one consultation, fill the prescription, then complete the visit." />
    {error && <p role="alert" className="mb-4 text-[#A12B35]">{error}</p>}{notice && <p role="status" className="mb-4 text-primary">{notice}</p>}
    <RemoteData state={state}>{(rows) => {
      const current = rows.find((row) => row.isCurrent);
      return <div className="space-y-6">
        <Card title="Current patient">{current ? <><p className="font-semibold mb-3">{current.patientName} · {current.time}</p>
          <Button onClick={() => setSelected(current)}>Fill prescription & complete</Button></> : <p>No consultation in progress.</p>}</Card>
        <Card title="Appointment queue">{rows.length ? <Table caption="Today's appointment queue" heads={['Time', 'Patient', 'Status', 'Action']}>
          {rows.map((a) => <tr key={a.id}><td>{a.time}</td><td>{a.patientName}</td><td><Badge status={a.status} /></td><td>
            {!a.isCurrent && <Button variant="secondary" disabled={!!current || busy} onClick={() => start(a)}>Start consultation</Button>}
          </td></tr>)}
        </Table> : <p>No appointments today.</p>}</Card>
      </div>;
    }}</RemoteData>
    {selected && <Prescription appointment={selected} onClose={() => setSelected(null)} onDone={() => {
      setSelected(null); setNotice('Visit completed. Prescription and bill created.'); state.reload();
    }} />}
  </>;
}
