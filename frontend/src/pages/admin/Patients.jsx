import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as admin from "../../api/admin";
import { useSnapshot, useQ } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  fmtDate,
} from "../../components/ui";
import {
  ConfirmDialog,
  Err,
  Gate,
  Pager,
  paginate,
  useToast,
} from "../../components/ui2";
import PatientForm from "../../components/PatientForm";
import { ageOf } from "../../lib/selectors";
import { ymd } from "../../api/mockDb";

export default function Patients() {
  const s = useSnapshot();
  const nav = useNavigate();
  const [get, set] = useQ({
    q: "",
    status: "active",
    gender: "",
    page: "1",
    new: "",
  });
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [err, setErr] = useState("");
  const [toast, show] = useToast();
  const today = ymd();
  const closeForm = () => {
    setForm(null);
    if (get("new")) set({ new: "" });
  };

  const toggle = async (p) => {
    try {
      await admin.setPatientStatus(
        p.id,
        p.status === "archived" ? "active" : "archived",
      );
      show(p.status === "archived" ? "Patient restored." : "Patient archived.");
      s.reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setConfirm(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Patients"
        description="Find records and manage patient details."
        action={<Button onClick={() => setForm({})}>Register patient</Button>}
      />
      {toast}
      <Err msg={err} />
      <Gate s={s}>
        {(db) => {
          const all = db.users.filter((u) => u.role === "patient");
          const q = get("q").toLowerCase();
          const rows = all
            .filter(
              (p) =>
                (get("status") === "all" ||
                  (p.status || "active") === get("status")) &&
                (!get("gender") || p.gender === get("gender")) &&
                (!q ||
                  `${p.name} ${p.mrn} ${p.phone}`.toLowerCase().includes(q)),
            )
            .sort((a, b) =>
              (b.createdAt || "").localeCompare(a.createdAt || ""),
            );
          const pg = paginate(rows, +get("page"));
          const last = (id) =>
            db.appointments
              .filter(
                (a) =>
                  a.patientId === id &&
                  a.status !== "cancelled" &&
                  a.date <= today,
              )
              .map((a) => a.date)
              .sort()
              .at(-1);
          const filtered =
            get("q") || get("gender") || get("status") !== "active";
          return (
            <>
              {(form || get("new")) && (
                <PatientForm
                  patient={form?.id ? form : null}
                  patients={all}
                  onClose={closeForm}
                  onSaved={(u, created) => {
                    closeForm();
                    show(created ? "Patient registered." : "Patient saved.");
                    if (created) nav(`/admin/patients/${u.id}`);
                    else s.reload();
                  }}
                />
              )}
              {confirm && (
                <ConfirmDialog
                  title={
                    confirm.status === "archived"
                      ? "Restore patient?"
                      : "Archive patient?"
                  }
                  confirmLabel={
                    confirm.status === "archived"
                      ? "Restore"
                      : "Archive patient"
                  }
                  danger={confirm.status !== "archived"}
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => toggle(confirm)}
                >
                  {confirm.status === "archived"
                    ? `${confirm.name} will be able to book appointments again.`
                    : `${confirm.name} can no longer be booked until restored. Records are kept.`}
                </ConfirmDialog>
              )}
              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                <div className="sm:col-span-2">
                  <Field label="Search">
                    <Input
                      placeholder="Name, record ID or phone"
                      value={get("q")}
                      onChange={(e) => set({ q: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Status">
                  <Select
                    value={get("status")}
                    onChange={(e) => set({ status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="all">All</option>
                  </Select>
                </Field>
                <Field label="Gender">
                  <Select
                    value={get("gender")}
                    onChange={(e) => set({ gender: e.target.value })}
                  >
                    <option value="">All</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </Select>
                </Field>
              </div>
              {filtered && (
                <Button
                  variant="ghost"
                  className="mb-3"
                  onClick={() => set({ q: "", status: "active", gender: "" })}
                >
                  Clear filters
                </Button>
              )}
              <Card>
                {all.length === 0 ? (
                  <Empty title="No patient records yet.">
                    <Button onClick={() => setForm({})}>
                      Register patient
                    </Button>
                  </Empty>
                ) : rows.length === 0 ? (
                  <Empty title="No patients match these filters.">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        set({ q: "", status: "active", gender: "" })
                      }
                    >
                      Clear filters
                    </Button>
                  </Empty>
                ) : (
                  <>
                    <Table
                      caption="Patients"
                      heads={[
                        "Patient",
                        "Age / gender",
                        "Phone",
                        "Latest visit",
                        "Status",
                        "Actions",
                      ]}
                    >
                      {pg.rows.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <Link
                              className="text-primary font-medium"
                              to={`/admin/patients/${p.id}`}
                            >
                              {p.name}
                            </Link>
                            <p className="text-xs text-muted tabular-nums">
                              {p.mrn}
                            </p>
                          </td>
                          <td>
                            {ageOf(p.dob)} · {p.gender}
                          </td>
                          <td className="tabular-nums">{p.phone}</td>
                          <td>{last(p.id) ? fmtDate(last(p.id)) : "—"}</td>
                          <td>
                            <Badge status={p.status || "active"} />
                          </td>
                          <td className="whitespace-nowrap">
                            <Button
                              variant="ghost"
                              aria-label={`Edit ${p.name}`}
                              onClick={() => setForm(p)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              aria-label={`${p.status === "archived" ? "Restore" : "Archive"} ${p.name}`}
                              onClick={() => setConfirm(p)}
                            >
                              {p.status === "archived" ? "Restore" : "Archive"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </Table>
                    <Pager pg={pg} onPage={(n) => set({ page: String(n) })} />
                  </>
                )}
              </Card>
            </>
          );
        }}
      </Gate>
    </>
  );
}
