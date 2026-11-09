import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import {
  Badge,
  Button,
  Card,
  Empty,
  Loading,
  PageHeader,
  Table,
  fmtDate,
} from "../../components/ui";

export default function MyAppointments() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const load = () => api.listMyAppointments(user.id).then(setRows);
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, []);

  const cancel = async (a) => {
    if (!window.confirm(`Cancel your appointment with ${a.doctor.name}?`))
      return;
    await api.cancelMyAppointment(a.id);
    load();
  };
  return (
    <>
      <PageHeader
        title="My appointments"
        description="Upcoming and past visits."
        action={
          <Link to="/patient/doctors">
            <Button>Book appointment</Button>
          </Link>
        }
      />
      <Card>
        {!rows ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty title="No appointments yet.">
            Find a doctor to book your first visit.
          </Empty>
        ) : (
          <Table
            caption="My appointments"
            heads={["Date", "Time", "Doctor", "Department", "Status", ""]}
          >
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{fmtDate(a.date)}</td>
                <td className="tabular-nums">{a.time}</td>
                <td>{a.doctor.name}</td>
                <td>{a.department?.name}</td>
                <td>
                  <Badge status={a.status} />
                </td>
                <td>
                  {["scheduled", "checked_in"].includes(a.status) && (
                    <Button variant="ghost" onClick={() => cancel(a)}>
                      Cancel
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
