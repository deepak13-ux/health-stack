import { CalendarDays } from "lucide-react";
import * as api from "../../api/index.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { ageFrom, fmtDate, hospitalToday } from "../../lib/clock.js";
import { displayId } from "../../lib/rules.js";
import { DataTable } from "../../components/DataTable.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, ButtonLink, Card, EmptyState, PageHeader, PersonIdentity, StatusBadge } from "../../components/ui.jsx";

export function DoctorQueue() {
  useTitle("Today's appointments");
  const state = useRemote(api.doctorQueue, "doctor-queue");
  const today = hospitalToday();
  const secondary = (p) => `${displayId("P", p.id)} · ${ageFrom(p.dob, today)} y · ${p.gender}`;
  const columns = [
    { key: "time", header: "Time", sortValue: (a) => a.time, render: (a) => <span className="tabular-nums font-medium">{a.time}</span> },
    { key: "patient", header: "Patient", sortValue: (a) => a.patient.name, render: (a) => <PersonIdentity name={a.patient.name} to={`/appointments/${a.id}`} secondary={secondary(a.patient)} /> },
    { key: "phone", header: "Phone", render: (a) => <span className="tabular-nums">{a.patient.phone}</span> },
    { key: "status", header: "Status", render: () => <StatusBadge status="waiting" /> },
    { key: "open", header: <span className="sr-only">Actions</span>, render: (a) => <ButtonLink size="sm" variant="secondary" to={`/appointments/${a.id}`} aria-label={`Open visit for ${a.patient.name}`}>Open visit</ButtonLink> },
  ];
  return (
    <>
      <PageHeader title="Today's appointments" description={`Scheduled visits for ${fmtDate(today, { weekday: true })}. Open a visit to review history and complete it.`}
        secondary={<Button variant="secondary" onClick={state.reload} pending={state.loading && !!state.data}>Refresh</Button>} />
      <Card bodyClass="pb-1">
        <RemoteData state={state} rows={5}>
          {(queue) => (
            <DataTable caption="Today's appointment queue" columns={columns} rows={queue} defaultSort="time"
              renderCard={(a) => (
                <div className="border border-line rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="tabular-nums font-semibold">{a.time}</p><PersonIdentity size="sm" name={a.patient.name} to={`/appointments/${a.id}`} secondary={secondary(a.patient)} /></div>
                  <StatusBadge status="waiting" />
                </div>
              )}
              empty={<EmptyState icon={CalendarDays} title="No appointments waiting today.">Completed and cancelled visits don't appear in this queue.</EmptyState>} />
          )}
        </RemoteData>
      </Card>
    </>
  );
}
