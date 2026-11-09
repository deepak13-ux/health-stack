import { useState } from "react";
import { useSnapshot } from "../../hooks";
import {
  Button,
  Card,
  Empty,
  Field,
  Input,
  PageHeader,
  Stat,
  Table,
  inr,
} from "../../components/ui";
import { BarChart, Gate, Tabs } from "../../components/ui2";
import { addDays, ymd } from "../../api/mockDb";
import {
  apptByDay,
  apptSummary,
  balanceOf,
  bills,
  billStatus,
  byId,
  collectionsByDay,
  deptBreakdown,
  fmtDT,
  methodBreakdown,
  occupancyByWard,
  rangeDays,
  sumPaid,
} from "../../lib/selectors";
import { downloadCSV } from "../../lib/csv";

export default function Reports() {
  const s = useSnapshot();
  const today = ymd();
  const [tab, setTab] = useState("appointments");
  const [range, setRange] = useState({ from: addDays(-6), to: today });
  const preset = (k) =>
    setRange(
      k === "today"
        ? { from: today, to: today }
        : k === "week"
          ? { from: addDays(-6), to: today }
          : { from: today.slice(0, 8) + "01", to: today },
    );
  const valid = range.from && range.to && range.from <= range.to;
  return (
    <>
      <PageHeader
        title="Reports"
        description="Operational numbers from the same records as the dashboard."
      />
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Button variant="secondary" onClick={() => preset("today")}>
          Today
        </Button>
        <Button variant="secondary" onClick={() => preset("week")}>
          Last 7 days
        </Button>
        <Button variant="secondary" onClick={() => preset("month")}>
          This month
        </Button>
        <Field label="From">
          <Input
            type="date"
            value={range.from}
            max={range.to}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
        </Field>
        <Field label="To">
          <Input
            type="date"
            value={range.to}
            min={range.from}
            max={today}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </Field>
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["appointments", "Appointments"],
          ["collections", "Collections"],
          ["occupancy", "Occupancy"],
        ]}
      />
      {!valid ? (
        <Card>
          <Empty title="Choose a valid date range." />
        </Card>
      ) : (
        <Gate s={s}>
          {(db) => {
            const days = rangeDays(range.from, range.to);
            const P = byId(db.users);
            if (tab === "appointments") {
              const sm = apptSummary(db, days);
              const dep = deptBreakdown(db, days);
              return (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        downloadCSV(
                          "appointments-by-department.csv",
                          [
                            "Department",
                            "Total",
                            "Completed",
                            "No-show",
                            "Cancelled",
                          ],
                          dep.map((d) => [
                            d.department,
                            d.total,
                            d.completed,
                            d.noShow,
                            d.cancelled,
                          ]),
                        )
                      }
                    >
                      Export CSV
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <Stat label="Total" value={sm.total} />
                    <Stat label="Completed" value={sm.completed} />
                    <Stat label="No-show" value={sm.noShow} />
                    <Stat label="Cancelled" value={sm.cancelled} />
                  </div>
                  <p className="text-xs text-muted">
                    Counts appointments dated within the range, by their current
                    status.
                  </p>
                  {sm.total === 0 ? (
                    <Card>
                      <Empty title="No appointments in this range." />
                    </Card>
                  ) : (
                    <Card title="Appointments per day">
                      <BarChart
                        data={apptByDay(db, days).slice(-31)}
                        caption="Appointments per day"
                      />
                    </Card>
                  )}
                  <Card title="By department">
                    <Table
                      caption="Department breakdown"
                      heads={[
                        "Department",
                        "Total",
                        "Completed",
                        "No-show",
                        "Cancelled",
                      ]}
                    >
                      {dep.map((d) => (
                        <tr key={d.department} className="tabular-nums">
                          <td>{d.department}</td>
                          <td>{d.total}</td>
                          <td>{d.completed}</td>
                          <td>{d.noShow}</td>
                          <td>{d.cancelled}</td>
                        </tr>
                      ))}
                    </Table>
                  </Card>
                </div>
              );
            }
            if (tab === "collections") {
              const col = collectionsByDay(db, days);
              const total = col.reduce((a, c) => a + c.value, 0);
              const open = bills(db).filter(
                (b) => b.state === "issued" && balanceOf(b) > 0,
              );
              return (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        downloadCSV(
                          "invoice-balances.csv",
                          [
                            "Invoice",
                            "Patient",
                            "Total",
                            "Paid",
                            "Balance",
                            "Status",
                          ],
                          open.map((b) => [
                            b.number,
                            P[b.patientId]?.name,
                            b.total,
                            sumPaid(b),
                            balanceOf(b),
                            billStatus(b),
                          ]),
                        )
                      }
                    >
                      Export CSV (invoice balances)
                    </Button>
                  </div>
                  <Stat
                    label="Collected in range"
                    value={inr(total)}
                    hint="Sum of recorded payments, never invoice totals"
                  />
                  {total === 0 ? (
                    <Card>
                      <Empty title="No payments recorded in this range." />
                    </Card>
                  ) : (
                    <Card title="Daily collections">
                      <BarChart
                        data={col.slice(-31)}
                        fmt={inr}
                        caption="Daily recorded payments"
                      />
                    </Card>
                  )}
                  <Card title="Payment methods">
                    <Table
                      caption="Payment methods"
                      heads={["Method", "Payments", "Amount"]}
                    >
                      {methodBreakdown(db, days).map((m) => (
                        <tr key={m.method} className="tabular-nums">
                          <td>{m.method}</td>
                          <td>{m.count}</td>
                          <td>{inr(m.amount)}</td>
                        </tr>
                      ))}
                    </Table>
                  </Card>
                  <Card title="Open invoice balances (current)">
                    {open.length === 0 ? (
                      <Empty title="No outstanding invoices." />
                    ) : (
                      <Table
                        caption="Invoice balances"
                        heads={[
                          "Invoice",
                          "Patient",
                          "Total",
                          "Paid",
                          "Balance",
                          "Status",
                        ]}
                      >
                        {open.map((b) => (
                          <tr key={b.id} className="tabular-nums">
                            <td>{b.number}</td>
                            <td>{P[b.patientId]?.name}</td>
                            <td>{inr(b.total)}</td>
                            <td>{inr(sumPaid(b))}</td>
                            <td>{inr(balanceOf(b))}</td>
                            <td>{billStatus(b)}</td>
                          </tr>
                        ))}
                      </Table>
                    )}
                  </Card>
                </div>
              );
            }
            const occ = occupancyByWard(db);
            const act = db.admissions.filter((a) => a.status === "active");
            const B = byId(db.beds);
            const D = byId(db.doctors);
            return (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      downloadCSV(
                        "active-admissions.csv",
                        ["Patient", "Doctor", "Bed", "Admitted"],
                        act.map((a) => [
                          P[a.patientId]?.name,
                          D[a.doctorId]?.name,
                          B[a.bedId]?.code,
                          fmtDT(a.admittedAt),
                        ]),
                      )
                    }
                  >
                    Export CSV (active admissions)
                  </Button>
                </div>
                <p className="bg-softblue border border-bluebd rounded-lg p-3">
                  Current snapshot. Historical occupancy is not tracked in this
                  version.
                </p>
                <Card title="Occupancy by ward">
                  <Table
                    caption="Occupancy by ward"
                    heads={[
                      "Ward",
                      "Occupied",
                      "Available",
                      "Maintenance",
                      "Total",
                    ]}
                  >
                    {occ.map((w) => (
                      <tr key={w.ward} className="tabular-nums">
                        <td>{w.ward}</td>
                        <td>{w.occupied}</td>
                        <td>{w.available}</td>
                        <td>{w.maintenance}</td>
                        <td>{w.total}</td>
                      </tr>
                    ))}
                  </Table>
                </Card>
                <Card title="Active admissions">
                  {act.length === 0 ? (
                    <Empty title="No active admissions." />
                  ) : (
                    <Table
                      caption="Active admissions"
                      heads={["Patient", "Doctor", "Bed", "Admitted"]}
                    >
                      {act.map((a) => (
                        <tr key={a.id}>
                          <td>{P[a.patientId]?.name}</td>
                          <td>{D[a.doctorId]?.name}</td>
                          <td>{B[a.bedId]?.code}</td>
                          <td>{fmtDT(a.admittedAt)}</td>
                        </tr>
                      ))}
                    </Table>
                  )}
                </Card>
              </div>
            );
          }}
        </Gate>
      )}
    </>
  );
}
