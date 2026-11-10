import * as api from '../../api/api';
import { useRemote } from '../../useRemote';
import { RemoteData } from '../../components/RemoteData';
import BillCard from '../../components/BillCard';
import { Card, PageHeader } from '../../components/ui';
export default function MyRecords() {
  const prescriptions = useRemote(api.listPrescriptions);
  const bills = useRemote(api.listBills);
  return <><PageHeader title="Prescriptions & bill history" description="The pharmacist records payment after it is received." />
    <div className="grid xl:grid-cols-2 gap-6">
      <section><h2 className="text-lg font-semibold mb-3">Running prescriptions</h2><RemoteData state={prescriptions}>{(rows) => rows.length ?
        <div className="space-y-4">{rows.map((r) => <Card key={r.id} title={r.doctorName}>
          <p className="text-muted mb-2">Valid until {r.validUntil}</p>{r.notes && <p className="mb-3">{r.notes}</p>}
          <ul className="space-y-2">{r.items.map((m, index) => <li key={index}>{m.name} × {m.qty} · {m.dosage} · {m.frequency}</li>)}</ul>
          {!r.items.length && <p>No medicines prescribed.</p>}
        </Card>)}</div> : <Card>No running prescriptions.</Card>}</RemoteData></section>
      <section><h2 className="text-lg font-semibold mb-3">Bill history</h2><RemoteData state={bills}>{(rows) => rows.length ?
        <div className="space-y-4">{rows.map((bill) => <BillCard key={bill.id} bill={bill} />)}</div> : <Card>No bills yet.</Card>}</RemoteData></section>
    </div>
  </>;
}
