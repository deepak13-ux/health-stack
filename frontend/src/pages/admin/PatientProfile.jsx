import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSnapshot } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  PageHeader,
  Table,
  fmtDate,
  inr,
} from "../../components/ui";
import { Gate, Tabs, useToast } from "../../components/ui2";
import AdminBookModal from "../../components/AdminBookModal";
import {
  ageOf,
  balanceOf,
  bills,
  billStatus,
  byId,
  fmtDT,
} from "../../lib/selectors";

export default function PatientProfile() {
  const { id } = useParams();
  const s = useSnapshot();
  const [tab, setTab] = useState("appointments");
  const [book, setBook] = useState(false);
  const [toast, show] = useToast();
  return (
    <Gate s={s}>
      {(db) => {
        const p = db.users.find((u) => u.id === id && u.role === "patient");
        if (!p)
          return (
            <Card>
              <Empty title="Record not found.">
                <Link className="text-primary" to="/admin/patients">
                  Back to patients
                </Link>
              </Empty>
            </Card>
          );
        const D = byId(db.doctors);
        const B = byId(db.beds);
        const W = byId(db.wards);
        const appts = db.appointments
          .filter((a) => a.patientId === id)
          .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
        const rx = db.prescriptions.filter((r) => r.patientId === id).reverse();
        const adms = db.admissions.filter((a) => a.patientId === id);
        const inv = bills(db).filter((b) => b.patientId === id);
        const em = p.emergency || {};
        return (
          <>
            {toast}
            <PageHeader
              title={p.name}
              description={`${p.mrn} · ${ageOf(p.dob)} yrs · ${p.gender} · Blood group ${p.bloodGroup || "Not recorded"}`}
              action={
                <Button
                  onClick={() => setBook(true)}
                  disabled={p.status === "archived"}
                >
                  Book appointment
                </Button>
              }
            />
            {p.allergies && (
              <p className="mb-4 bg-[#FFF4D6] text-[#785400] rounded-lg p-3">
                ⚠ Allergies: {p.allergies}
              </p>
            )}
            <div className="grid lg:grid-cols-[320px_1fr] gap-6">
              <Card title="Summary">
                <dl className="space-y-3">
                  {[
                    ["Phone", p.phone],
                    ["Email", p.email],
                    ["Address", p.address || "Not recorded"],
                    [
                      "Emergency contact",
                      em.name
                        ? `${em.name} (${em.relationship || "contact"}) · ${em.phone}`
                        : "Not recorded",
                    ],
                    ["Allergies", p.allergies || "Not recorded"],
                    ["Registered", p.createdAt ? fmtDT(p.createdAt) : "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs font-semibold text-muted">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="text-xs font-semibold text-muted">Status</dt>
                    <dd>
                      <Badge status={p.status || "active"} />
                    </dd>
                  </div>
                </dl>
              </Card>
              <div>
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    ["appointments", "Appointments"],
                    ["prescriptions", "Prescriptions"],
                    ["admissions", "Admissions"],
                    ["billing", "Billing"],
                  ]}
                />
                <Card>
                  {tab === "appointments" &&
                    (appts.length === 0 ? (
                      <Empty title="No appointments yet." />
                    ) : (
                      <Table
                        caption="Appointments"
                        heads={["Date", "Time", "Doctor", "Status"]}
                      >
                        {appts.map((a) => (
                          <tr key={a.id}>
                            <td>{fmtDate(a.date)}</td>
                            <td className="tabular-nums">{a.time}</td>
                            <td>{D[a.doctorId]?.name}</td>
                            <td>
                              <Badge status={a.status} />
                            </td>
                          </tr>
                        ))}
                      </Table>
                    ))}
                  {tab === "prescriptions" &&
                    (rx.length === 0 ? (
                      <Empty title="No prescriptions yet." />
                    ) : (
                      rx.map((r) => (
                        <div
                          key={r.id}
                          className="py-3 border-b border-line last:border-0"
                        >
                          <p className="font-medium">
                            {D[r.doctorId]?.name} ·{" "}
                            <span className="text-muted">
                              {fmtDT(r.createdAt)}
                            </span>
                          </p>
                          {r.notes && <p>{r.notes}</p>}
                          <p className="text-muted">
                            {r.items
                              .map((m) => `${m.name} × ${m.qty}`)
                              .join(", ") || "No medicines"}
                          </p>
                        </div>
                      ))
                    ))}
                  {tab === "admissions" &&
                    (adms.length === 0 ? (
                      <Empty title="No admissions." />
                    ) : (
                      <Table
                        caption="Admissions"
                        heads={[
                          "Ward / bed",
                          "Admitted",
                          "Discharged",
                          "Status",
                        ]}
                      >
                        {adms.map((a) => (
                          <tr key={a.id}>
                            <td>
                              {W[B[a.bedId]?.wardId]?.name} · {B[a.bedId]?.code}
                            </td>
                            <td>{fmtDT(a.admittedAt)}</td>
                            <td>
                              {a.dischargedAt ? fmtDT(a.dischargedAt) : "—"}
                            </td>
                            <td>
                              <Badge status={a.status} />
                            </td>
                          </tr>
                        ))}
                      </Table>
                    ))}
                  {tab === "billing" &&
                    (inv.length === 0 ? (
                      <Empty title="No invoices." />
                    ) : (
                      <Table
                        caption="Invoices"
                        heads={["Invoice", "Total", "Balance", "Status"]}
                      >
                        {inv.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <Link
                                className="text-primary"
                                to={`/admin/billing/${b.id}`}
                              >
                                {b.number}
                              </Link>
                            </td>
                            <td className="tabular-nums">{inr(b.total)}</td>
                            <td className="tabular-nums">
                              {inr(balanceOf(b))}
                            </td>
                            <td>
                              <Badge status={billStatus(b)} />
                            </td>
                          </tr>
                        ))}
                      </Table>
                    ))}
                </Card>
              </div>
            </div>
            {book && (
              <AdminBookModal
                db={db}
                patientId={id}
                onClose={() => setBook(false)}
                onBooked={() => {
                  setBook(false);
                  show("Appointment booked.");
                  s.reload();
                }}
              />
            )}
          </>
        );
      }}
    </Gate>
  );
}
