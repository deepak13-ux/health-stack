import { Pill } from "lucide-react";
import * as api from "../../api/index.js";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { hospitalToday } from "../../lib/clock.js";
import { isRunning } from "../../lib/rules.js";
import { PrescriptionCard } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, EmptyState, PageHeader, Tabs } from "../../components/ui.jsx";

export function Prescriptions() {
  useTitle("Prescriptions");
  const state = useRemote(api.myAppointments, "my-appointments");
  const [q, setQ] = useQueryState({ tab: "running" });
  const today = hospitalToday();
  return (
    <>
      <PageHeader title="Prescriptions" description="Medicines and instructions recorded by your doctors." />
      <RemoteData state={state} rows={5}>
        {(appts) => {
          const all = appts.filter((a) => a.prescription).sort((a, b) => b.prescription.date.localeCompare(a.prescription.date));
          const running = all.filter((a) => isRunning(a.prescription, today));
          const shown = q.tab === "all" ? all : running;
          return (
            <>
              <Tabs label="Prescription views" value={q.tab} onChange={(tab) => setQ({ tab })}
                tabs={[{ value: "running", label: "Running", count: running.length }, { value: "all", label: "History", count: all.length }]} />
              {shown.length ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {shown.map((a) => <PrescriptionCard key={a.prescription.id} prescription={a.prescription} doctorName={a.doctorName} visitDate={a.date} headingLevel={2} />)}
                </div>
              ) : (
                <div className="bg-white border border-line rounded-2xl">
                  <EmptyState icon={Pill} title={q.tab === "all" ? "No prescriptions yet." : "No running prescriptions."}
                    action={q.tab !== "all" && all.length ? <Button variant="secondary" onClick={() => setQ({ tab: "all" })}>View prescription history</Button> : undefined}>
                    Prescriptions appear here after a doctor completes your visit.
                  </EmptyState>
                </div>
              )}
            </>
          );
        }}
      </RemoteData>
    </>
  );
}
