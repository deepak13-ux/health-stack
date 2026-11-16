import { useState } from "react";
import { useParams } from "react-router-dom";
import { History } from "lucide-react";
import * as api from "../../api/index.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { ageFrom, fmtDate, hospitalToday } from "../../lib/clock.js";
import { canDoctorComplete, displayId } from "../../lib/rules.js";
import { PrescriptionCard, RecordNotFound } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, ButtonLink, Card, DefinitionList, EmptyState, PageHeader, PersonIdentity, StatusBadge, Tabs } from "../../components/ui.jsx";
import { CompleteVisitDialog } from "./CompleteVisitDialog.jsx";

function VisitHistory({ visits }) {
  if (!visits.length) return <EmptyState icon={History} title="No other visits on record." />;
  return (
    <ol className="space-y-3">
      {visits.map((v) => (
        <li key={v.id} className="bg-white border border-line rounded-2xl">
          <details open={!!v.prescription && v === visits[0]}>
            <summary className="list-none flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl hover:bg-row-hover">
              <span>
                <span className="font-semibold tabular-nums">{fmtDate(v.date, { weekday: true })}, {v.time}</span>
                <span className="text-muted"> · {v.doctorName} · {v.department}</span>
              </span>
              <span className="flex items-center gap-2">
                {v.prescription && <span className="text-xs text-muted">Prescription</span>}
                <StatusBadge status={v.status} />
              </span>
            </summary>
            <div className="px-4 pb-4">
              {v.prescription ? <PrescriptionCard prescription={v.prescription} doctorName={v.doctorName} visitDate={v.date} headingLevel={4} /> : <p className="text-muted">No prescription recorded for this visit.</p>}
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

export function DoctorAppointment() {
  const { appointmentId } = useParams();
  useTitle(displayId("A", appointmentId));
  const toast = useToast();
  const state = useRemote(() => api.getAppointment(appointmentId), appointmentId);
  const [q, setQ] = useQueryState({ tab: "visit" });
  const [completing, setCompleting] = useState(false);
  const today = hospitalToday();

  if (state.error?.status === 404) return <RecordNotFound what="appointment" backTo="/appointments" backLabel="Back to today's appointments" />;

  return (
    <RemoteData state={state} rows={6}>
      {(a) => {
        const p = a.patient;
        const self = a.history.find((h) => h.id === a.id);
        const others = a.history.filter((h) => h.id !== a.id);
        return (
          <>
            <PageHeader title={p.name} description={`${displayId("P", p.id)} · ${ageFrom(p.dob, today)} years · ${p.gender}`}
              primary={canDoctorComplete(a, today) && <Button onClick={() => setCompleting(true)}>Complete visit</Button>}
              secondary={<ButtonLink variant="secondary" to="/appointments">Back to queue</ButtonLink>}>
              <div className="flex items-center gap-2 mb-2 text-muted"><span className="tabular-nums">{displayId("A", a.id)}</span>·<span className="tabular-nums">{fmtDate(a.date, { weekday: true })}, {a.time}</span><StatusBadge status={a.status} /></div>
            </PageHeader>
            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
              <Card title="Patient">
                <div className="mb-4"><PersonIdentity size="lg" name={p.name} secondary={displayId("P", p.id)} /></div>
                <DefinitionList items={[
                  ["Date of birth", `${fmtDate(p.dob)} (${ageFrom(p.dob, today)} years)`],
                  ["Gender", p.gender],
                  ["Phone", <span key="ph" className="tabular-nums">{p.phone}</span>],
                  ["Email", p.email],
                  ["Location", [p.city, p.state].filter(Boolean).join(", ") || null],
                  ["Medical history notes", p.history],
                ]} />
              </Card>
              <div className="min-w-0">
                <Tabs label="Visit information" value={q.tab} onChange={(tab) => setQ({ tab })}
                  tabs={[{ value: "visit", label: "This visit" }, { value: "history", label: "Visit history", count: others.length }]} />
                {q.tab === "history" ? <VisitHistory visits={others} /> : (
                  <div className="space-y-4">
                    {a.status === "completed" && self?.prescription
                      ? <PrescriptionCard prescription={self.prescription} doctorName="Prescription for this visit" visitDate={a.date} />
                      : (
                        <Card title="Consultation">
                          {canDoctorComplete(a, today) ? (
                            <div className="space-y-3">
                              <p>Record the prescription to complete this visit. Completing creates the patient's bill: ₹200 consultation plus the prescribed medicines.</p>
                              <Button onClick={() => setCompleting(true)}>Complete visit</Button>
                            </div>
                          ) : a.status === "scheduled" ? (
                            <p className="text-muted">This visit is on {fmtDate(a.date, { weekday: true })}. It can be completed on or after that day.</p>
                          ) : (
                            <p className="text-muted">This visit is {a.status}. No prescription is recorded.</p>
                          )}
                        </Card>
                      )}
                  </div>
                )}
              </div>
            </div>
            {completing && (
              <CompleteVisitDialog appointment={a} onClose={() => setCompleting(false)}
                onDone={(result) => {
                  setCompleting(false);
                  toast(`Visit completed. Bill ${displayId("B", result.bill_id)} created.`);
                  state.reload();
                }} />
            )}
          </>
        );
      }}
    </RemoteData>
  );
}
