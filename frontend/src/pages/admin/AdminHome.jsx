import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Users, BedDouble, Wallet } from "lucide-react";
import { useSnapshot } from "../../hooks";
import {
  Badge,
  Button,
  Card,
  Empty,
  PageHeader,
  Stat,
  inr,
} from "../../components/ui";
import { BarChart, Gate } from "../../components/ui2";
import {
  apptByDay,
  byId,
  kpis,
  occupancyByWard,
  rangeDays,
} from "../../lib/selectors";
import { addDays, ymd } from "../../api/mockDb";

export default function AdminHome() {
  const s = useSnapshot();
  const nav = useNavigate();
  return (
    <>
      <PageHeader
        title="Overview"
        description="Here’s what’s happening at the hospital today."
        action={
          <Button onClick={() => nav("/admin/appointments?book=1")}>
            Book appointment
          </Button>
        }
      />
      <Gate s={s}>
        {(db) => {
          const today = ymd();
          const k = kpis(db, today);
          const P = byId(db.users);
          const D = byId(db.doctors);
          const Dp = byId(db.departments);
          const rows = db.appointments
            .filter((a) => a.date === today && a.status !== "cancelled")
            .sort((a, b) => a.time.localeCompare(b.time))
            .slice(0, 5);
          return (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <Stat
                  label="Today’s appointments"
                  value={k.todayCount}
                  hint={`${k.checkedIn} checked in`}
                  icon={CalendarDays}
                />
                <Stat
                  label="Registered patients"
                  value={k.patients}
                  hint="Active records"
                  icon={Users}
                />
                <Stat
                  label="Beds available"
                  value={k.bedsAvail}
                  hint={`${k.occ} occupied / ${k.totalBeds} total`}
                  icon={BedDouble}
                />
                <Stat
                  label="Collected today"
                  value={inr(k.collectedToday)}
                  hint="Recorded payments"
                  icon={Wallet}
                />
              </div>
              <div className="grid xl:grid-cols-[1fr_376px] gap-6">
                <Card
                  title="Today’s appointments"
                  action={
                    <Link
                      className="text-primary font-medium"
                      to="/admin/appointments"
                    >
                      View schedule
                    </Link>
                  }
                >
                  {rows.length === 0 ? (
                    <Empty title="No appointments for today." />
                  ) : (
                    <ul className="divide-y divide-line">
                      {rows.map((a) => (
                        <li
                          key={a.id}
                          className="py-3 grid grid-cols-[56px_1fr_auto] gap-3 items-center"
                        >
                          <b className="tabular-nums">{a.time}</b>
                          <span>
                            {P[a.patientId]?.name}
                            <span className="block text-xs text-muted">
                              {D[a.doctorId]?.name} ·{" "}
                              {Dp[D[a.doctorId]?.deptId]?.name}
                            </span>
                          </span>
                          <Badge status={a.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <section className="bg-softblue border border-bluebd rounded-2xl p-5">
                  <h2 className="text-lg font-semibold">Bed occupancy</h2>
                  <p className="text-[30px] font-semibold tabular-nums">
                    {k.occ}
                    <span className="text-muted text-lg"> / {k.totalBeds}</span>
                  </p>
                  <div
                    className="h-2.5 rounded-full bg-[#EDF2F6] my-3"
                    role="progressbar"
                    aria-valuenow={k.occ}
                    aria-valuemax={k.totalBeds}
                    aria-label="Occupied beds"
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(k.occ / k.totalBeds) * 100}%` }}
                    />
                  </div>
                  <ul className="space-y-1 mb-3">
                    {occupancyByWard(db).map((w) => (
                      <li key={w.ward} className="flex justify-between">
                        <span>{w.ward}</span>
                        <span className="tabular-nums">
                          {w.occupied}/{w.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="text-primary font-medium"
                    to="/admin/admissions?tab=beds"
                  >
                    View beds
                  </Link>
                </section>
                <Card title="Appointments, next 7 days">
                  <BarChart
                    data={apptByDay(db, rangeDays(today, addDays(6)))}
                    highlight={today}
                    caption="Appointments per day for the next seven days"
                  />
                </Card>
                <Card title="Quick actions">
                  <div className="space-y-2">
                    <Button
                      variant="lime"
                      className="w-full"
                      onClick={() => nav("/admin/patients?new=1")}
                    >
                      Register patient
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => nav("/admin/appointments?book=1")}
                    >
                      Book appointment
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => nav("/admin/billing/new")}
                    >
                      Create invoice
                    </Button>
                  </div>
                </Card>
              </div>
            </>
          );
        }}
      </Gate>
    </>
  );
}
