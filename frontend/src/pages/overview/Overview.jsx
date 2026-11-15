import { Link } from "react-router-dom";
import { CalendarClock, CalendarDays, Clock, IndianRupee, Pill, Receipt, Users } from "lucide-react";
import * as api from "../../api/index.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { ageFrom, fmtDate, hospitalNowStamp, hospitalToday, relativeDay, stamp } from "../../lib/clock.js";
import { inr } from "../../lib/money.js";
import { billBalance, billPaid, displayId, isRunning } from "../../lib/rules.js";
import { RemoteData } from "../../components/RemoteData.jsx";
import { ButtonLink, Card, EmptyState, MetricCard, PageHeader, PersonIdentity, ProgressBar, StatusBadge } from "../../components/ui.jsx";

const KPI_GRID = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6";
const SPLIT = "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_376px] gap-6";

function CompactList({ caption, rows, empty }) {
  if (!rows.length) return empty;
  return (
    <ul aria-label={caption} className="divide-y divide-line">
      {rows.map((r) => (
        <li key={r.key} className="min-h-12 py-2 flex items-center gap-4">
          <span className="w-24 shrink-0 tabular-nums text-muted">{r.when}</span>
          <div className="flex-1 min-w-0">{r.main}</div>
          {r.badge}
        </li>
      ))}
    </ul>
  );
}

function PatientOverview() {
  const { user } = useAuth();
  const state = useRemote(() => Promise.all([api.myDashboard(), api.myAppointments()]), "patient-overview");
  const today = hospitalToday();
  return (
    <>
      <PageHeader title="Overview" description={`Welcome back, ${user.name.split(" ")[0]}. Here's your care at a glance.`}
        primary={<ButtonLink to="/doctors">Book appointment</ButtonLink>} />
      <RemoteData state={state} rows={6}>
        {([dash, appts]) => {
          // Same rule as the server's upcoming count: scheduled and starting from now.
          const now = hospitalNowStamp();
          const upcoming = appts.filter((a) => a.status === "scheduled" && stamp(a) >= now).sort((a, b) => stamp(a).localeCompare(stamp(b)));
          const bills = appts.filter((a) => a.bill);
          const billed = bills.reduce((s, a) => s + a.bill.totalPaise, 0);
          const paid = bills.reduce((s, a) => s + billPaid(a.bill), 0);
          const due = bills.reduce((s, a) => s + billBalance(a.bill), 0);
          const running = appts.filter((a) => a.prescription && isRunning(a.prescription, today));
          return (
            <>
              <div className={KPI_GRID}>
                <MetricCard label="Upcoming appointments" value={dash.upcomingAppointments} hint="Scheduled from now on" icon={CalendarDays} to="/appointments" />
                <MetricCard label="Running prescriptions" value={dash.activePrescriptions} hint="Still within validity" icon={Pill} to="/prescriptions" />
                <MetricCard label="Unpaid bills" value={dash.pendingBills} hint="Awaiting payment" icon={Receipt} to="/billing?status=unpaid" />
                <MetricCard label="Amount due" value={inr(due)} hint="Across unpaid bills" icon={IndianRupee} to="/billing?status=unpaid" />
              </div>
              <div className={`${SPLIT} mb-6`}>
                <Card title="Upcoming appointments" action={<Link to="/appointments" className="text-primary font-medium hover:underline">View all</Link>}>
                  <CompactList caption="Upcoming appointments" rows={upcoming.slice(0, 5).map((a) => ({
                    key: a.id,
                    when: <>{relativeDay(a.date, today)}<br />{a.time}</>,
                    main: <><Link to={`/appointments/${a.id}`} className="font-medium text-primary hover:underline">{a.doctorName}</Link><p className="text-xs text-muted">{a.department}</p></>,
                    badge: <StatusBadge status={a.status} />,
                  }))} empty={<EmptyState icon={CalendarDays} title="No upcoming appointments." action={<ButtonLink to="/doctors" variant="secondary">Book appointment</ButtonLink>} />} />
                </Card>
                <Card title="Bills" tone="blue" action={<Link to="/billing" className="text-primary font-medium hover:underline">View bills</Link>}>
                  <p className="text-xs font-semibold text-muted">Paid of total billed</p>
                  <p className="text-[30px] leading-[38px] font-semibold tabular-nums">{inr(paid)} <span className="text-base text-muted font-normal">/ {inr(billed)}</span></p>
                  <div className="my-4"><ProgressBar value={paid} max={billed} label="Share of billed amount paid" /></div>
                  <dl className="space-y-2 tabular-nums">
                    <div className="flex justify-between"><dt>Bills issued</dt><dd>{bills.length}</dd></div>
                    <div className="flex justify-between"><dt>Outstanding</dt><dd className="font-semibold">{inr(due)}</dd></div>
                  </dl>
                </Card>
              </div>
              <div className={SPLIT}>
                <Card title="Running prescriptions" action={<Link to="/prescriptions" className="text-primary font-medium hover:underline">View all</Link>}>
                  <CompactList caption="Running prescriptions" rows={running.slice(0, 4).map((a) => ({
                    key: a.prescription.id,
                    when: fmtDate(a.prescription.date, { year: false }),
                    main: <><p className="font-medium">{a.doctorName}</p><p className="text-xs text-muted truncate">{a.prescription.items.map((i) => i.name).join(", ") || "No medicines prescribed"}</p></>,
                    badge: <span className="text-xs text-muted tabular-nums whitespace-nowrap">Until {fmtDate(a.prescription.validUntil, { year: false })}</span>,
                  }))} empty={<EmptyState icon={Pill} title="No running prescriptions." />} />
                </Card>
                <Card title="Quick actions">
                  <div className="flex flex-col gap-2">
                    <ButtonLink to="/doctors" variant="lime">Book appointment</ButtonLink>
                    <ButtonLink to="/prescriptions" variant="secondary">View prescriptions</ButtonLink>
                    <ButtonLink to="/billing" variant="secondary">View bills</ButtonLink>
                  </div>
                  <p className="text-xs text-muted mt-3">Bookings are open for today and the next 3 days. Same-day changes aren't allowed.</p>
                </Card>
              </div>
            </>
          );
        }}
      </RemoteData>
    </>
  );
}

function DoctorOverview() {
  const state = useRemote(api.doctorQueue, "doctor-overview");
  const today = hospitalToday();
  return (
    <>
      <PageHeader title="Overview" description={`Your scheduled visits for ${fmtDate(today, { weekday: true })}.`}
        primary={<ButtonLink to="/appointments">View my schedule</ButtonLink>} />
      <RemoteData state={state} rows={6}>
        {(queue) => {
          const next = queue[0];
          return (
            <>
              <div className={KPI_GRID.replace("xl:grid-cols-4", "xl:grid-cols-3")}>
                <MetricCard label="Waiting today" value={queue.length} hint="Scheduled, not yet completed" icon={Users} to="/appointments" />
                <MetricCard label="Next appointment" value={next ? next.time : "—"} hint={next ? next.patient.name : "No one waiting"} icon={Clock} to={next ? `/appointments/${next.id}` : undefined} />
                <MetricCard label="Last slot today" value={queue.length ? queue[queue.length - 1].time : "—"} hint="Latest scheduled start" icon={CalendarClock} />
              </div>
              <div className={SPLIT}>
                <Card title="Today's appointments" action={<Link to="/appointments" className="text-primary font-medium hover:underline">View schedule</Link>}>
                  <CompactList caption="Today's appointments" rows={queue.slice(0, 5).map((a) => ({
                    key: a.id,
                    when: a.time,
                    main: <PersonIdentity size="sm" name={a.patient.name} to={`/appointments/${a.id}`} secondary={`${displayId("P", a.patient.id)} · ${ageFrom(a.patient.dob, today)} y · ${a.patient.gender}`} />,
                    badge: <StatusBadge status="waiting" />,
                  }))} empty={<EmptyState icon={CalendarDays} title="No appointments waiting today." />} />
                </Card>
                <Card title="Quick actions">
                  <div className="flex flex-col gap-2">
                    {next && <ButtonLink to={`/appointments/${next.id}`} variant="lime">Open next patient</ButtonLink>}
                    <ButtonLink to="/appointments" variant="secondary">View my schedule</ButtonLink>
                  </div>
                  <p className="text-xs text-muted mt-3">Completing a visit records the prescription and creates the bill (₹200 consultation plus medicines).</p>
                </Card>
              </div>
            </>
          );
        }}
      </RemoteData>
    </>
  );
}

function PharmacistOverview() {
  const state = useRemote(api.pendingBills, "pharmacy-overview");
  return (
    <>
      <PageHeader title="Overview" description="Unpaid bills and the prescriptions to dispense with them."
        primary={<ButtonLink to="/billing">Open pending bills</ButtonLink>} />
      <RemoteData state={state} rows={6}>
        {(bills) => {
          const due = bills.reduce((s, b) => s + b.totalPaise, 0);
          const withMeds = bills.filter((b) => b.prescription?.items.length);
          const oldest = bills.reduce((min, b) => (!min || b.date < min ? b.date : min), null);
          return (
            <>
              <div className={KPI_GRID}>
                <MetricCard label="Pending bills" value={bills.length} hint="Awaiting payment" icon={Receipt} to="/billing" />
                <MetricCard label="Outstanding" value={inr(due)} hint="Sum of pending bills" icon={IndianRupee} />
                <MetricCard label="To dispense" value={withMeds.length} hint="Pending bills with medicines" icon={Pill} />
                <MetricCard label="Oldest pending" value={oldest ? fmtDate(oldest, { year: false }) : "—"} hint="Bill date" icon={CalendarDays} />
              </div>
              <div className={SPLIT}>
                <Card title="Pending bills" action={<Link to="/billing" className="text-primary font-medium hover:underline">View all</Link>}>
                  <CompactList caption="Pending bills" rows={bills.slice(0, 5).map((b) => ({
                    key: b.id,
                    when: fmtDate(b.date, { year: false }),
                    main: <><Link to={`/billing/${b.id}`} className="font-medium text-primary hover:underline tabular-nums">{displayId("B", b.id)}</Link><p className="text-xs text-muted">{b.patient.name}</p></>,
                    badge: <span className="tabular-nums font-semibold">{inr(b.totalPaise)}</span>,
                  }))} empty={<EmptyState icon={Receipt} title="No pending bills." />} />
                </Card>
                <Card title="Quick actions">
                  <ButtonLink to="/billing" variant="lime" className="w-full">Record a payment</ButtonLink>
                  <p className="text-xs text-muted mt-3">Payments are recorded for the full bill amount once received.</p>
                </Card>
              </div>
            </>
          );
        }}
      </RemoteData>
    </>
  );
}

export default function Overview() {
  const { user } = useAuth();
  useTitle("Overview");
  if (user.role === "doctor") return <DoctorOverview />;
  if (user.role === "pharmacist") return <PharmacistOverview />;
  return <PatientOverview />;
}
