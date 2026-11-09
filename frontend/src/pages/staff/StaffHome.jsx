import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, BedDouble } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import { Badge, Card, Empty, PageHeader, Stat } from "../../components/ui";

export default function StaffHome() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [adm, setAdm] = useState([]);
  useEffect(() => {
    api.listStaffAppointments(user).then(setRows);
    api.listAdmissions().then(setAdm);
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const t = rows.filter((a) => a.date === today && a.status !== "cancelled");
  const admitted = adm.filter(
    (a) => user.role === "nurse" || a.doctorId === user.doctorId,
  ).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Here’s what’s happening today."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Stat
          label={
            user.role === "doctor"
              ? "My appointments today"
              : "Appointments today"
          }
          value={t.length}
          icon={CalendarDays}
        />
        <Stat
          label="Waiting patients"
          value={t.filter((a) => a.status === "checked_in").length}
          hint="Checked in"
          icon={Clock}
        />
        <Stat
          label="Patients seen"
          value={t.filter((a) => a.status === "completed").length}
          icon={CheckCircle2}
        />
        <Stat label="Admitted patients" value={admitted} icon={BedDouble} />
      </div>
      <Card
        title="Today’s appointments"
        action={
          <Link className="text-primary font-medium" to="/staff/schedule">
            View schedule
          </Link>
        }
      >
        {t.length === 0 ? (
          <Empty title="No appointments today." />
        ) : (
          <ul className="divide-y divide-line">
            {t.slice(0, 5).map((a) => (
              <li key={a.id} className="py-3 flex justify-between items-center">
                <span>
                  <b className="tabular-nums">{a.time}</b> · {a.patient.name}{" "}
                  <span className="text-muted">· {a.doctor.name}</span>
                </span>
                <Badge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
