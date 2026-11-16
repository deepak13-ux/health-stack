import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import * as api from "../../api/index.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { fmtDate, hospitalToday, relativeDay, stamp } from "../../lib/clock.js";
import { canPatientChange, displayId } from "../../lib/rules.js";
import { RescheduleDialog } from "../../components/BookingDialog.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { ConfirmDialog } from "../../components/Dialog.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, ButtonLink, Card, EmptyState, PageHeader, StatusBadge, Tabs } from "../../components/ui.jsx";

const TABS = {
  upcoming: (a, today) => a.status === "scheduled" && a.date >= today,
  past: (a, today) => a.status === "completed" || (a.status === "scheduled" && a.date < today),
  cancelled: (a) => a.status === "cancelled",
  all: () => true,
};

// Row actions shared by the list and the detail page.
export function useAppointmentActions(reload) {
  const toast = useToast();
  const [cancelling, setCancelling] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const dialogs = (
    <>
      {cancelling && (
        <ConfirmDialog title="Cancel appointment?" destructive confirmLabel="Cancel appointment" pendingLabel="Cancelling…"
          onClose={() => setCancelling(null)}
          onConfirm={async () => {
            await api.cancelAppointment(cancelling.id);
            setCancelling(null);
            toast("Appointment cancelled.");
            reload();
          }}>
          <p>
            Your visit with <strong>{cancelling.doctorName}</strong> on {fmtDate(cancelling.date, { weekday: true })} at {cancelling.time} will be cancelled and the slot released. This can't be undone.
          </p>
        </ConfirmDialog>
      )}
      {rescheduling && (
        <RescheduleDialog appointment={rescheduling} onClose={() => setRescheduling(null)}
          onDone={() => { setRescheduling(null); toast("Appointment rescheduled."); reload(); }} />
      )}
    </>
  );
  return { dialogs, cancel: setCancelling, reschedule: setRescheduling };
}

export function AppointmentActions({ appointment, today, actions, compact }) {
  if (canPatientChange(appointment, today)) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button size={compact ? "sm" : "md"} variant="secondary" aria-label={compact ? `Reschedule appointment ${displayId("A", appointment.id)}` : undefined} onClick={() => actions.reschedule(appointment)}>Reschedule</Button>
        <Button size={compact ? "sm" : "md"} variant="danger" aria-label={compact ? `Cancel appointment ${displayId("A", appointment.id)}` : undefined} onClick={() => actions.cancel(appointment)}>Cancel</Button>
      </div>
    );
  }
  if (appointment.status === "scheduled" && appointment.date === today) {
    return <span className="text-xs text-muted">Same-day changes aren't allowed</span>;
  }
  return null;
}

export function PatientAppointments() {
  useTitle("Appointments");
  const state = useRemote(api.myAppointments, "my-appointments");
  const [q, setQ] = useQueryState({ tab: "upcoming" });
  const today = hospitalToday();
  const actions = useAppointmentActions(state.reload);
  const tab = TABS[q.tab] ? q.tab : "upcoming";

  return (
    <>
      <PageHeader title="Appointments" description="Your visits, past and upcoming." primary={<ButtonLink to="/doctors">Book appointment</ButtonLink>} />
      <RemoteData state={state} rows={6}>
        {(all) => {
          const rows = all.filter((a) => TABS[tab](a, today));
          const columns = [
            { key: "when", header: "Date & time", sortValue: stamp, render: (a) => (
              <Link to={`/appointments/${a.id}`} className="font-medium text-primary hover:underline tabular-nums">
                {fmtDate(a.date, { weekday: true })}, {a.time}
              </Link>
            ) },
            { key: "doctor", header: "Doctor", sortValue: (a) => a.doctorName, render: (a) => a.doctorName },
            { key: "department", header: "Department", sortValue: (a) => a.department || "", render: (a) => a.department || "—" },
            { key: "status", header: "Status", sortValue: (a) => a.status, render: (a) => <StatusBadge status={a.status} /> },
            { key: "actions", header: <span className="sr-only">Actions</span>, render: (a) => <AppointmentActions appointment={a} today={today} actions={actions} compact /> },
          ];
          return (
            <Card bodyClass="pb-1">
              <div className="px-5 pt-3"><Tabs label="Appointment views" value={tab} onChange={(v) => setQ({ tab: v, sort: undefined, dir: undefined })}
                tabs={[
                  { value: "upcoming", label: "Upcoming", count: all.filter((a) => TABS.upcoming(a, today)).length },
                  { value: "past", label: "Past" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "all", label: "All", count: all.length },
                ]} /></div>
              <DataTable key={tab} caption="Your appointments" columns={columns} rows={rows} defaultSort="when" defaultDir={tab === "upcoming" ? "asc" : "desc"}
                renderCard={(a) => (
                  <div className="border border-line rounded-xl p-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <Link to={`/appointments/${a.id}`} className="font-semibold text-primary hover:underline tabular-nums">{relativeDay(a.date, today)}, {a.time}</Link>
                      <StatusBadge status={a.status} />
                    </div>
                    <p>{a.doctorName} <span className="text-muted">· {a.department}</span></p>
                    <AppointmentActions appointment={a} today={today} actions={actions} compact />
                  </div>
                )}
                empty={all.length
                  ? <EmptyState icon={CalendarDays} title={tab === "upcoming" ? "No upcoming appointments." : "Nothing in this view."} action={tab === "upcoming" ? <ButtonLink to="/doctors" variant="secondary">Book appointment</ButtonLink> : <Button variant="secondary" onClick={() => setQ({ tab: "all" })}>Show all appointments</Button>} />
                  : <EmptyState icon={CalendarDays} title="No appointments yet." action={<ButtonLink to="/doctors">Book appointment</ButtonLink>}>Choose a doctor and an available slot to book your first visit.</EmptyState>} />
            </Card>
          );
        }}
      </RemoteData>
      {actions.dialogs}
    </>
  );
}
