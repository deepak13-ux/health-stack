import { useState } from "react";
import { Stethoscope } from "lucide-react";
import * as api from "../../api/index.js";
import { useQueryState } from "../../hooks/useQueryState.js";
import { useRemote } from "../../hooks/useRemote.js";
import { useTitle } from "../../hooks/useTitle.js";
import { inr } from "../../lib/money.js";
import { BookingDialog } from "../../components/BookingDialog.jsx";
import { DataTable } from "../../components/DataTable.jsx";
import { RemoteData } from "../../components/RemoteData.jsx";
import { Button, Card, EmptyState, PageHeader, PersonIdentity, SearchInput, Select } from "../../components/ui.jsx";

export function DoctorDirectory() {
  useTitle("Doctors");
  const state = useRemote(() => Promise.all([api.listDepartments(), api.listDoctors()]), "doctors");
  const [q, setQ] = useQueryState({ q: "", dept: "" });
  const [booking, setBooking] = useState(null);
  const filtered = (doctors) => doctors.filter((d) =>
    (!q.dept || String(d.departmentId) === q.dept) &&
    (!q.q || `${d.name} ${d.department}`.toLowerCase().includes(q.q.trim().toLowerCase())));
  const active = (q.q ? 1 : 0) + (q.dept ? 1 : 0);

  const columns = [
    { key: "name", header: "Doctor", sortValue: (d) => d.name.replace(/^Dr\.\s*/, ""), render: (d) => <PersonIdentity name={d.name} to={`/doctors/${d.id}`} secondary={d.department} /> },
    { key: "department", header: "Department", sortValue: (d) => d.department, render: (d) => d.department },
    { key: "fee", header: "Consultation fee", align: "right", sortValue: (d) => d.feePaise, render: (d) => inr(d.feePaise) },
    { key: "book", header: <span className="sr-only">Actions</span>, render: (d) => <Button size="sm" aria-label={`Book ${d.name}`} onClick={() => setBooking(d)}>Book</Button> },
  ];

  return (
    <>
      <PageHeader title="Doctors" description="Find a doctor and book an available slot." primary={<Button onClick={() => setBooking({})}>Book appointment</Button>} />
      <RemoteData state={state} rows={6}>
        {([departments, doctors]) => {
          const rows = filtered(doctors);
          return (
            <Card bodyClass="pb-1">
              <div className="flex flex-col md:flex-row gap-3 px-5 py-4 border-b border-line">
                <SearchInput label="Search doctors" placeholder="Search by name or department" value={q.q} onChange={(v) => setQ({ q: v })} className="md:w-80" />
                <label className="sr-only" htmlFor="dept-filter">Department</label>
                <Select id="dept-filter" value={q.dept} onChange={(e) => setQ({ dept: e.target.value })} className="md:w-56">
                  <option value="">All departments</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                {active > 0 && <Button variant="ghost" onClick={() => setQ({ q: "", dept: "" })}>Clear filters ({active})</Button>}
              </div>
              <DataTable caption="Doctors" columns={columns} rows={rows} defaultSort="name"
                renderCard={(d) => (
                  <div className="border border-line rounded-xl p-4 flex items-center justify-between gap-3">
                    <PersonIdentity name={d.name} to={`/doctors/${d.id}`} secondary={`${d.department} · ${inr(d.feePaise)}`} />
                    <Button size="sm" aria-label={`Book ${d.name}`} onClick={() => setBooking(d)}>Book</Button>
                  </div>
                )}
                empty={doctors.length
                  ? <EmptyState icon={Stethoscope} title="No doctors match these filters." action={<Button variant="secondary" onClick={() => setQ({ q: "", dept: "" })}>Clear filters</Button>} />
                  : <EmptyState icon={Stethoscope} title="No doctors are available right now." />} />
            </Card>
          );
        }}
      </RemoteData>
      {booking && <BookingDialog initialDoctorId={booking.id || ""} onClose={() => setBooking(null)} />}
    </>
  );
}
