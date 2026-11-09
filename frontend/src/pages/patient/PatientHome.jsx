import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FileText, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import {
  Badge,
  Button,
  Card,
  Empty,
  PageHeader,
  Stat,
  fmtDate,
  inr,
} from "../../components/ui";

export default function PatientHome() {
  const { user } = useAuth();
  const [appts, setAppts] = useState([]);
  const [bills, setBills] = useState([]);
  const [rx, setRx] = useState([]);
  useEffect(() => {
    api.listMyAppointments(user.id).then(setAppts);
    api.listMyBills(user.id).then(setBills);
    api.listMyPrescriptions(user.id).then(setRx);
  }, [user.id]);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appts.filter(
    (a) => a.date >= today && ["scheduled", "checked_in"].includes(a.status),
  );
  const due = bills
    .filter((b) => b.status === "unpaid")
    .reduce((s, b) => s + b.total, 0);

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description="Here’s your health admin at a glance."
        action={
          <Link to="/patient/doctors">
            <Button>Book appointment</Button>
          </Link>
        }
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat
          label="Upcoming appointments"
          value={upcoming.length}
          hint="Scheduled or checked in"
          icon={CalendarDays}
        />
        <Stat
          label="Prescriptions"
          value={rx.length}
          hint="Issued by your doctors"
          icon={FileText}
        />
        <Stat
          label="Amount due"
          value={inr(due)}
          hint="Unpaid bills"
          icon={Wallet}
        />
      </div>
      <Card
        title="Next appointments"
        action={
          <Link className="text-primary font-medium" to="/patient/appointments">
            View all
          </Link>
        }
      >
        {upcoming.length === 0 ? (
          <Empty title="Nothing booked.">
            Find a doctor and choose a time.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {upcoming.slice(0, 5).map((a) => (
              <li key={a.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{a.doctor.name}</p>
                  <p className="text-muted">
                    {fmtDate(a.date)} ·{" "}
                    <span className="tabular-nums">{a.time}</span> ·{" "}
                    {a.department?.name}
                  </p>
                </div>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
