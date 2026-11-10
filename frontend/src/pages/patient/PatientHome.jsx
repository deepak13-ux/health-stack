import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRemote } from '../../useRemote';
import { RemoteData } from '../../components/RemoteData';
import * as api from '../../api/api';
import { Button, Card, PageHeader, Stat } from '../../components/ui';
export default function PatientHome() {
  const { user } = useAuth();
  const state = useRemote(() => Promise.all([api.listAppointments(), api.listPrescriptions(), api.listBills()]));
  return <><PageHeader title={`Hello, ${user.name}`} description="Your appointments, running prescriptions and bill history."
    action={<Link to="/patient/doctors"><Button>Book appointment</Button></Link>} />
    <RemoteData state={state}>{([appointments, prescriptions, bills]) => <>
      <div className="grid sm:grid-cols-3 gap-4 mb-6"><Stat label="Active appointments" value={appointments.length} />
        <Stat label="Running prescriptions" value={prescriptions.length} /><Stat label="Unpaid bills" value={bills.filter((b) => b.status === 'unpaid').length} /></div>
      <Card title="Your records"><div className="flex gap-4 flex-wrap"><Link className="text-primary underline" to="/patient/appointments">View appointments</Link>
        <Link className="text-primary underline" to="/patient/records">Prescriptions & bill history</Link></div></Card>
    </>}</RemoteData>
  </>;
}
