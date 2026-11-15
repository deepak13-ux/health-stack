import * as api from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useQueryState } from "../hooks/useQueryState.js";
import { useRemote } from "../hooks/useRemote.js";
import { useTitle } from "../hooks/useTitle.js";
import { ageFrom, BOOKING_WINDOW_DAYS, fmtDate, hospitalToday } from "../lib/clock.js";
import { inr } from "../lib/money.js";
import { displayId } from "../lib/rules.js";
import { RemoteData } from "../components/RemoteData.jsx";
import { Card, DefinitionList, PageHeader, PersonIdentity, Tabs } from "../components/ui.jsx";

const ROLE = { patient: "Patient", doctor: "Doctor", pharmacist: "Pharmacist" };

// Profile fields come from the server and are read-only: no profile-update API exists yet.
function loadProfile(user) {
  if (user.role === "patient") return api.myProfile().then((p) => ({ kind: "patient", p }));
  if (user.role === "doctor") return api.getDoctor(user.userId).then((d) => ({ kind: "doctor", d }));
  return Promise.resolve({ kind: "staff" });
}

function Profile() {
  const { user } = useAuth();
  const state = useRemote(() => loadProfile(user), `profile|${user.accountId}`);
  const today = hospitalToday();
  return (
    <Card title="My profile">
      <div className="mb-5"><PersonIdentity size="lg" name={user.name} secondary={`${ROLE[user.role]}${user.email ? ` · ${user.email}` : ""}`} /></div>
      <RemoteData state={state} rows={4}>
        {(r) => (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {r.kind === "patient" && <>
              <DefinitionList items={[
                ["Patient record", <span key="id" className="tabular-nums">{displayId("P", r.p.id)}</span>],
                ["Full name", r.p.name],
                ["Email", r.p.email],
                ["Phone", <span key="ph" className="tabular-nums">{r.p.phone}</span>],
              ]} />
              <DefinitionList items={[
                ["Date of birth", r.p.dob && `${fmtDate(r.p.dob)} (${ageFrom(r.p.dob, today)} years)`],
                ["Gender", r.p.gender],
                ["Address", [r.p.street, r.p.city, r.p.state].filter(Boolean).join(", ") || null],
                ["Medical history notes", r.p.history],
              ]} />
            </>}
            {r.kind === "doctor" && <>
              <DefinitionList items={[["Name", r.d.name], ["Email", user.email], ["Department", r.d.department]]} />
              <DefinitionList items={[["Licence number", r.d.licenseNo], ["Consultation fee", inr(r.d.feePaise)]]} />
            </>}
            {r.kind === "staff" && <DefinitionList items={[["Name", user.name], ["Email", user.email], ["Role", ROLE[user.role]]]} />}
          </div>
        )}
      </RemoteData>
      <p className="text-xs text-muted mt-6 border-t border-line pt-4">Profile details are read-only here. Ask the front desk to correct any of them.</p>
    </Card>
  );
}

function Workspace() {
  return (
    <Card title="Workspace">
      <DefinitionList items={[
        ["Hospital", "Careflow Community Hospital"],
        ["Currency", "Indian rupee (INR)"],
        ["Timezone", "Asia/Kolkata"],
        ["Appointment length", "30 minutes"],
        ["Booking window", `Today and the next ${BOOKING_WINDOW_DAYS} days`],
        ["Data", "All people and records in this workspace are fictional demo data."],
      ]} />
    </Card>
  );
}

export default function Settings() {
  useTitle("Settings");
  const [q, setQ] = useQueryState({ tab: "profile" });
  return (
    <>
      <PageHeader title="Settings" description="Your account and workspace details." />
      <Tabs label="Settings sections" value={q.tab} onChange={(tab) => setQ({ tab })} tabs={[{ value: "profile", label: "Profile" }, { value: "workspace", label: "Workspace" }]} />
      <div className="max-w-3xl">{q.tab === "workspace" ? <Workspace /> : <Profile />}</div>
    </>
  );
}
