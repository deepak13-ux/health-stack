import { useState } from "react";
import * as admin from "../../api/admin";
import { useSnapshot, useQ } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Stat,
  Table,
  inr,
} from "../../components/ui";
import { Err, Gate, Tabs, useToast } from "../../components/ui2";
import { downloadCSV } from "../../lib/csv";
import { Wallet, Users } from "lucide-react";

const earned = (e) => Math.round((e.salary / e.workingDays) * e.daysWorked);

function EmployeeForm({ emp, onClose, onSaved }) {
  const e0 = emp?.employment;
  const [f, setF] = useState({
    role: "nurse",
    name: emp?.name || "",
    email: emp?.email || "",
    phone: e0?.phone || "",
    shift: e0?.shift || "Day",
    salary: e0?.salary ?? 30000,
    workingDays: e0?.workingDays ?? 26,
    daysWorked: e0?.daysWorked ?? 0,
    joinedOn: e0?.joinedOn || new Date().toISOString().slice(0, 10),
    inactive: !!emp?.inactive,
  });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter a name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email.";
    if (!/^\d{10}$/.test(f.phone)) e.phone = "Enter a valid 10-digit phone.";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await admin.saveEmployee({ ...f, id: emp?.id });
      onSaved();
    } catch (x) {
      setErrs({ form: x.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      wide
      title={emp ? `Edit ${emp.name}` : "Add employee"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Err msg={errs.form} />
        <div className="grid sm:grid-cols-2 gap-3">
          {!emp && (
            <Field label="Role">
              <Select value={f.role} onChange={set("role")}>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
          )}
          <Field label="Name" required error={errs.name}>
            <Input value={f.name} onChange={set("name")} />
          </Field>
          <Field
            label="Email"
            required
            error={errs.email}
            helper={emp ? "" : "Initial password: staff123"}
          >
            <Input type="email" value={f.email} onChange={set("email")} />
          </Field>
          <Field label="Phone" required error={errs.phone}>
            <Input value={f.phone} onChange={set("phone")} />
          </Field>
          <Field label="Shift">
            <Select value={f.shift} onChange={set("shift")}>
              <option>Day</option>
              <option>Evening</option>
              <option>Night</option>
            </Select>
          </Field>
          <Field label="Joined on">
            <Input type="date" value={f.joinedOn} onChange={set("joinedOn")} />
          </Field>
          <Field label="Monthly salary (₹)">
            <Input
              type="number"
              min="0"
              value={f.salary}
              onChange={set("salary")}
            />
          </Field>
          <Field label="Working days this month">
            <Input
              type="number"
              min="1"
              value={f.workingDays}
              onChange={set("workingDays")}
            />
          </Field>
          <Field label="Days worked">
            <Input
              type="number"
              min="0"
              value={f.daysWorked}
              onChange={set("daysWorked")}
            />
          </Field>
          {emp && (
            <label className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={f.inactive}
                onChange={(e) => setF({ ...f, inactive: e.target.checked })}
              />{" "}
              Deactivate account
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            {emp ? "Save changes" : "Add employee"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Employees() {
  const s = useSnapshot();
  const [get, set] = useQ({ tab: "directory" });
  const [form, setForm] = useState(null);
  const [toast, show] = useToast();
  const month = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return (
    <>
      <PageHeader
        title="Employees"
        description="Staff directory, attendance and payroll."
        action={<Button onClick={() => setForm({})}>Add employee</Button>}
      />
      {toast}
      <Gate s={s}>
        {(db) => {
          const staff = db.users.filter(
            (u) => u.role !== "patient" && u.employment,
          );
          const active = staff.filter((u) => !u.inactive);
          const total = active.reduce((a, u) => a + earned(u.employment), 0);
          return (
            <>
              {form && (
                <EmployeeForm
                  emp={form.id ? form : null}
                  onClose={() => setForm(null)}
                  onSaved={() => {
                    setForm(null);
                    show("Employee saved.");
                    s.reload();
                  }}
                />
              )}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Stat
                  label="Active employees"
                  value={active.length}
                  icon={Users}
                />
                <Stat
                  label={`Payroll earned · ${month}`}
                  value={inr(total)}
                  hint="Salary ÷ working days × days worked"
                  icon={Wallet}
                />
              </div>
              <Tabs
                value={get("tab")}
                onChange={(t) => set({ tab: t })}
                tabs={[
                  ["directory", "Directory"],
                  ["payroll", "Payroll"],
                ]}
              />
              <Card>
                {staff.length === 0 ? (
                  <Empty title="No employees." />
                ) : get("tab") === "directory" ? (
                  <Table
                    caption="Employee directory"
                    heads={[
                      "Name",
                      "Role",
                      "Phone",
                      "Shift",
                      "Joined",
                      "Status",
                      "",
                    ]}
                  >
                    {staff.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <b>{u.name}</b>
                          <p className="text-xs text-muted">{u.email}</p>
                        </td>
                        <td className="capitalize">{u.role}</td>
                        <td className="tabular-nums">{u.employment.phone}</td>
                        <td>{u.employment.shift}</td>
                        <td>
                          {new Date(u.employment.joinedOn).toLocaleDateString(
                            "en-IN",
                          )}
                        </td>
                        <td>
                          <Badge status={u.inactive ? "inactive" : "active"} />
                        </td>
                        <td>
                          <Button
                            variant="ghost"
                            aria-label={`Edit ${u.name}`}
                            onClick={() => setForm(u)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <>
                    <div className="flex justify-end mb-3">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          downloadCSV(
                            "payroll.csv",
                            [
                              "Name",
                              "Role",
                              "Monthly salary",
                              "Working days",
                              "Days worked",
                              "Earned",
                            ],
                            staff.map((u) => [
                              u.name,
                              u.role,
                              u.employment.salary,
                              u.employment.workingDays,
                              u.employment.daysWorked,
                              earned(u.employment),
                            ]),
                          )
                        }
                      >
                        Export CSV
                      </Button>
                    </div>
                    <Table
                      caption="Payroll"
                      heads={[
                        "Name",
                        "Role",
                        "Monthly salary",
                        "Days worked",
                        "Earned",
                      ]}
                    >
                      {staff.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td className="capitalize">{u.role}</td>
                          <td className="tabular-nums">
                            {inr(u.employment.salary)}
                          </td>
                          <td className="tabular-nums">
                            {u.employment.daysWorked} /{" "}
                            {u.employment.workingDays}
                          </td>
                          <td className="tabular-nums font-medium">
                            {inr(earned(u.employment))}
                          </td>
                        </tr>
                      ))}
                    </Table>
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
