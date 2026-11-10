import * as api from '../../api/api';
import { useRemote } from '../../useRemote';
import { RemoteData } from '../../components/RemoteData';
import { Badge, Card, PageHeader, Table, fmtDate } from '../../components/ui';
export default function MyAppointments() {
  const state = useRemote(api.listAppointments);
  return <><PageHeader title="Active appointments" description="Your upcoming visits and consultations in progress." />
    <Card><RemoteData state={state}>{(rows) => rows.length ? <Table caption="Active appointments" heads={['Date', 'Time', 'Doctor', 'Status']}>
      {rows.map((a) => <tr key={a.id}><td>{fmtDate(a.date)}</td><td>{a.time}</td><td>{a.doctorName}</td><td><Badge status={a.status} /></td></tr>)}
    </Table> : <p>No active appointments. Choose a doctor to book a visit.</p>}</RemoteData></Card>
  </>;
}
