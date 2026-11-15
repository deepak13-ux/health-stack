import { Link, useParams } from "react-router-dom";
import * as api from "../../api/index.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { fmtDate, hospitalToday } from "../../lib/clock.js";
import { inr } from "../../lib/money.js";
import { billBalance, displayId } from "../../lib/rules.js";
import { BillLink, PrescriptionCard, RecordNotFound } from "../../components/Records.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Card, DefinitionList, PageHeader, StatusBadge } from "../../components/ui.jsx";
import { AppointmentActions, useAppointmentActions } from "./PatientAppointments.jsx";

export function PatientAppointment() {
  const { appointmentId } = useParams();
  useTitle(displayId("A", appointmentId));
  const state = useRemote(api.myAppointments, "my-appointments");
  const actions = useAppointmentActions(state.reload);
  const today = hospitalToday();
  return (
    <>
      <RemoteData state={state} rows={5}>
        {(all) => {
          const a = all.find((x) => String(x.id) === appointmentId);
          if (!a) return <RecordNotFound what="appointment" backTo="/appointments" backLabel="Back to appointments" />;
          return (
            <>
              <PageHeader title={`${a.doctorName}`} description={`${fmtDate(a.date, { weekday: true })} at ${a.time} · ${a.department || ""}`}
                primary={<AppointmentActions appointment={a} today={today} actions={actions} />}>
                <div className="flex items-center gap-2 mb-2"><span className="text-muted tabular-nums">{displayId("A", a.id)}</span><StatusBadge status={a.status} /></div>
              </PageHeader>
              <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
                <Card title="Visit details">
                  <DefinitionList items={[
                    ["Doctor", <Link key="d" to={`/doctors/${a.doctorId}`} className="text-primary hover:underline">{a.doctorName}</Link>],
                    ["Department", a.department],
                    ["Date", fmtDate(a.date, { weekday: true })],
                    ["Time", `${a.time} (30 minutes, Asia/Kolkata)`],
                    ["Status", <StatusBadge key="s" status={a.status} />],
                    a.bill && ["Bill", <span key="b" className="tabular-nums"><BillLink bill={a.bill} /> · {inr(a.bill.totalPaise)} · {billBalance(a.bill) ? `${inr(billBalance(a.bill))} due` : "Paid"}</span>],
                  ]} />
                </Card>
                <section aria-labelledby="rx-title" className="space-y-3">
                  <h2 id="rx-title" className="text-lg font-semibold">Prescription</h2>
                  {a.prescription
                    ? <PrescriptionCard prescription={a.prescription} doctorName={a.doctorName} visitDate={a.date} />
                    : <p className="bg-white border border-line rounded-2xl p-5 text-muted">{a.status === "completed" ? "No prescription was recorded for this visit." : "The doctor records the prescription when the visit is completed."}</p>}
                </section>
              </div>
            </>
          );
        }}
      </RemoteData>
      {actions.dialogs}
    </>
  );
}
