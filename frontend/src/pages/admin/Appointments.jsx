import { useEffect, useState } from "react";
import { useSnapshot, useQ } from "../../hooks";
import * as api from "../../api/api";
import * as admin from "../../api/admin";
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Table,
  Textarea,
  fmtDate,
} from "../../components/ui";
import { Err, Gate, Pager, paginate, useToast } from "../../components/ui2";
import AdminBookModal from "../../components/AdminBookModal";
import { byId } from "../../lib/selectors";
import { addDays, ymd } from "../../api/mockDb";

const TIMES = Array.from({ length: 16 }, (_, i) => {
  const m = 540 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const STATUSES = [
  ["", "All statuses"],
  ["scheduled", "Scheduled"],
  ["checked_in", "Checked in"],
  ["in_consultation", "In consultation"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
  ["no_show", "No-show"],
];

function ManageModal({ a, db, onClose, onDone }) {
  const [mode, setMode] = useState("");
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const P = byId(db.users);
  const D = byId(db.doctors);
  const loadSlots = () => {
    setSlots(null);
    admin.getSlotsFor(a.doctorId, date, a.id).then(setSlots);
  };
  useEffect(() => {
    if (mode === "reschedule") {
      setTime("");
      loadSlots();
    } /* eslint-disable-next-line */
  }, [mode, date]);
  const run = async (fn) => {
    setBusy(true);
    setErr("");
    try {
      await fn();
      onDone();
    } catch (e) {
      setErr(e.message);
      if (mode === "reschedule") {
        setTime("");
        loadSlots();
      }
    } finally {
      setBusy(false);
    }
  };
  const open = ["scheduled", "checked_in"].includes(a.status);

  return (
    <Modal title="Appointment" onClose={onClose}>
      <Err msg={err} />
      <p className="font-semibold">{P[a.patientId]?.name}</p>
      <p className="text-muted mb-3">
        {D[a.doctorId]?.name} · {fmtDate(a.date)} ·{" "}
        <span className="tabular-nums">{a.time}</span> ·{" "}
        <Badge status={a.status} />
      </p>
      {a.reason && <p className="mb-3">Reason: {a.reason}</p>}
      {!mode && (
        <div className="flex flex-wrap gap-2">
          {a.status === "scheduled" && (
            <Button
              loading={busy}
              onClick={() =>
                run(() => api.transitionAppointment(a.id, "checked_in"))
              }
            >
              Check in
            </Button>
          )}
          {open && (
            <Button variant="secondary" onClick={() => setMode("reschedule")}>
              Reschedule
            </Button>
          )}
          {open && (
            <Button variant="danger" onClick={() => setMode("cancel")}>
              Cancel appointment
            </Button>
          )}
          {a.status === "scheduled" && (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => run(() => admin.markNoShow(a.id))}
            >
              Mark no-show
            </Button>
          )}
          {!open && a.status !== "scheduled" && (
            <p className="text-muted">No actions available for this status.</p>
          )}
        </div>
      )}
      {mode === "reschedule" && (
        <div className="space-y-3">
          <Field label="New date">
            <Input
              type="date"
              min={ymd()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          {!slots ? (
            <Loading />
          ) : slots.length === 0 ? (
            <p className="text-muted">Doctor not working this day.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  disabled={!s.available}
                  aria-pressed={time === s.time}
                  onClick={() => setTime(s.time)}
                  className={`h-11 rounded-[10px] border tabular-nums ${time === s.time ? "bg-primary text-white border-primary" : "border-control bg-white"} disabled:bg-[#EDF2F6] disabled:line-through`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setMode("")}>
              Back
            </Button>
            <Button
              disabled={!time}
              loading={busy}
              onClick={() =>
                run(() => admin.rescheduleAppointment(a.id, date, time))
              }
            >
              Reschedule
            </Button>
          </div>
        </div>
      )}
      {mode === "cancel" && (
        <div className="space-y-3">
          <Field label="Reason (optional)">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <p className="text-muted">
            Cancelling frees the slot. Invoice history is kept.
          </p>
          <div className="flex justify-end gap-2">
            <Button autoFocus variant="secondary" onClick={() => setMode("")}>
              Keep appointment
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() => run(() => admin.cancelAppointment(a.id, reason))}
            >
              Cancel appointment
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function Appointments() {
  const s = useSnapshot();
  const today = ymd();
  const [get, set] = useQ({
    date: today,
    view: "grid",
    doctor: "",
    dept: "",
    status: "",
    q: "",
    page: "1",
    book: "",
  });
  const [manage, setManage] = useState(null);
  const [toast, show] = useToast();
  const date = get("date");
  const base = date === "all" ? today : date;
  const shift = (n) => set({ date: addDays(n, new Date(`${base}T00:00:00`)) });

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Coordinate visits and keep the day moving."
        action={
          <Button onClick={() => set({ book: "1" })}>Book appointment</Button>
        }
      />
      {toast}
      <Gate s={s}>
        {(db) => {
          const P = byId(db.users);
          const D = byId(db.doctors);
          const Dp = byId(db.departments);
          const q = get("q").toLowerCase();
          const rows = db.appointments
            .filter(
              (a) =>
                (date === "all" || a.date === date) &&
                (!get("doctor") || a.doctorId === get("doctor")) &&
                (!get("dept") || D[a.doctorId]?.deptId === get("dept")) &&
                (!get("status") || a.status === get("status")) &&
                (!q || P[a.patientId]?.name.toLowerCase().includes(q)),
            )
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
          const view = date === "all" ? "list" : get("view");
          const docs = db.doctors.filter(
            (d) =>
              d.status !== "inactive" &&
              (!get("doctor") || d.id === get("doctor")) &&
              (!get("dept") || d.deptId === get("dept")),
          );
          const pg = paginate(rows, +get("page"));
          const done = () => {
            setManage(null);
            show("Appointment updated.");
            s.reload();
          };
          return (
            <>
              {get("book") === "1" && (
                <AdminBookModal
                  db={db}
                  onClose={() => set({ book: "" })}
                  onBooked={() => {
                    set({ book: "" });
                    show("Appointment booked.");
                    s.reload();
                  }}
                />
              )}
              {manage && (
                <ManageModal
                  a={manage}
                  db={db}
                  onClose={() => setManage(null)}
                  onDone={done}
                />
              )}
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div className="flex items-end gap-1">
                  <Button
                    variant="secondary"
                    aria-label="Previous day"
                    onClick={() => shift(-1)}
                  >
                    ‹
                  </Button>
                  <Field label="Date">
                    <Input
                      type="date"
                      value={date === "all" ? "" : date}
                      onChange={(e) =>
                        e.target.value && set({ date: e.target.value })
                      }
                    />
                  </Field>
                  <Button
                    variant="secondary"
                    aria-label="Next day"
                    onClick={() => shift(1)}
                  >
                    ›
                  </Button>
                  <Button variant="ghost" onClick={() => set({ date: today })}>
                    Today
                  </Button>
                </div>
                <div
                  role="group"
                  aria-label="View"
                  className="flex border border-control rounded-[10px] overflow-hidden h-11"
                >
                  {[
                    ["grid", "Day"],
                    ["list", "List"],
                  ].map(([k, l]) => (
                    <button
                      key={k}
                      aria-pressed={view === k}
                      onClick={() =>
                        set({ view: k, date: date === "all" ? today : date })
                      }
                      className={`px-4 ${view === k ? "bg-primary text-white" : "bg-white"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <Button
                  variant={date === "all" ? "primary" : "secondary"}
                  onClick={() =>
                    set({ date: date === "all" ? today : "all", view: "list" })
                  }
                >
                  All dates
                </Button>
                <Field label="Doctor">
                  <Select
                    value={get("doctor")}
                    onChange={(e) => set({ doctor: e.target.value })}
                  >
                    <option value="">All doctors</option>
                    {db.doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Department">
                  <Select
                    value={get("dept")}
                    onChange={(e) => set({ dept: e.target.value })}
                  >
                    <option value="">All</option>
                    {db.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select
                    value={get("status")}
                    onChange={(e) => set({ status: e.target.value })}
                  >
                    {STATUSES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Patient">
                  <Input
                    placeholder="Search name"
                    value={get("q")}
                    onChange={(e) => set({ q: e.target.value })}
                  />
                </Field>
              </div>
              {view === "grid" ? (
                rows.length === 0 && docs.length === 0 ? (
                  <Card>
                    <Empty title="No doctors match." />
                  </Card>
                ) : (
                  <>
                    {rows.length === 0 && (
                      <p className="mb-3 text-muted">
                        No appointments for this day.{" "}
                        <button
                          className="text-primary font-medium"
                          onClick={() => set({ book: "1" })}
                        >
                          Book appointment
                        </button>
                      </p>
                    )}
                    <Card className="overflow-x-auto">
                      <div
                        className="min-w-[640px]"
                        style={{
                          display: "grid",
                          gridTemplateColumns: `64px repeat(${docs.length}, minmax(180px, 1fr))`,
                        }}
                      >
                        <div />
                        {docs.map((d) => (
                          <div
                            key={d.id}
                            className="px-2 py-2 text-xs font-semibold border-b border-line"
                          >
                            {d.name}
                          </div>
                        ))}
                        {TIMES.map((t) => (
                          <div key={t} className="contents">
                            <div className="px-2 py-2 text-xs text-muted tabular-nums border-b border-line">
                              {t}
                            </div>
                            {docs.map((d) => {
                              const a = rows.find(
                                (x) =>
                                  x.doctorId === d.id &&
                                  x.time === t &&
                                  x.status !== "cancelled",
                              );
                              const lunch = t === "13:00" || t === "13:30";
                              return (
                                <div
                                  key={d.id}
                                  className={`px-1 py-1 border-b border-line min-h-[48px] ${lunch ? "bg-[#F5F9FC]" : ""}`}
                                >
                                  {a ? (
                                    <button
                                      onClick={() => setManage(a)}
                                      className="w-full text-left rounded-lg bg-softblue border border-bluebd px-2 py-1 text-xs hover:bg-bluebd"
                                    >
                                      <b>{P[a.patientId]?.name}</b>
                                      <br />
                                      <Badge status={a.status} />
                                    </button>
                                  ) : lunch ? (
                                    <span className="text-[11px] text-muted">
                                      Lunch
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </>
                )
              ) : (
                <Card>
                  {rows.length === 0 ? (
                    <Empty title="No appointments match.">
                      Try other filters or{" "}
                      <button
                        className="text-primary font-medium"
                        onClick={() => set({ book: "1" })}
                      >
                        book an appointment
                      </button>
                      .
                    </Empty>
                  ) : (
                    <>
                      <Table
                        caption="Appointments"
                        heads={[
                          "Date / time",
                          "Patient",
                          "Doctor",
                          "Department",
                          "Status",
                          "Actions",
                        ]}
                      >
                        {pg.rows.map((a) => (
                          <tr key={a.id}>
                            <td className="whitespace-nowrap">
                              {fmtDate(a.date)} ·{" "}
                              <span className="tabular-nums">{a.time}</span>
                            </td>
                            <td>{P[a.patientId]?.name}</td>
                            <td>{D[a.doctorId]?.name}</td>
                            <td>{Dp[D[a.doctorId]?.deptId]?.name}</td>
                            <td>
                              <Badge status={a.status} />
                            </td>
                            <td>
                              <Button
                                variant="ghost"
                                aria-label={`Manage appointment for ${P[a.patientId]?.name}`}
                                onClick={() => setManage(a)}
                              >
                                Manage
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </Table>
                      <Pager pg={pg} onPage={(n) => set({ page: String(n) })} />
                    </>
                  )}
                </Card>
              )}
            </>
          );
        }}
      </Gate>
    </>
  );
}
