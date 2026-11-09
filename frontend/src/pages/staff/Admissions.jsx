import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import {
  Badge,
  Card,
  Empty,
  Loading,
  PageHeader,
  Table,
} from "../../components/ui";
import { stayDays } from "../../lib/selectors";

export default function Admissions() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    api.listAdmissions().then(setRows);
  }, []);
  const mine = (rows || []).filter(
    (a) => user.role === "nurse" || a.doctorId === user.doctorId,
  );
  return (
    <>
      <PageHeader
        title="Admitted patients"
        description={
          user.role === "nurse"
            ? "All active admissions across wards."
            : "Your active admissions."
        }
      />
      <Card>
        {!rows ? (
          <Loading />
        ) : mine.length === 0 ? (
          <Empty title="No admitted patients." />
        ) : (
          <Table
            caption="Active admissions"
            heads={[
              "Patient",
              "Ward / bed",
              "Attending",
              "Admitted",
              "Stay",
              "Reason",
              "Status",
            ]}
          >
            {mine.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.patient.name}</td>
                <td>
                  {a.ward.name} · {a.bed.code}
                </td>
                <td>{a.doctor?.name}</td>
                <td>{new Date(a.admittedAt).toLocaleDateString("en-IN")}</td>
                <td className="tabular-nums">
                  {stayDays(a.admittedAt)} day(s)
                </td>
                <td>{a.reason}</td>
                <td>
                  <Badge status="active" />
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
