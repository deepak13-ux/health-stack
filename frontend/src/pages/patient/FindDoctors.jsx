import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../api/api";
import {
  Button,
  Card,
  Empty,
  Field,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  Textarea,
  inr,
} from "../../components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BookingModal({ doctor, onClose, onBooked }) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const loadSlots = () => {
    setSlots(null);
    api.getSlots(doctor.id, date).then(setSlots);
  };
  useEffect(() => {
    setTime("");
    loadSlots(); /* eslint-disable-next-line */
  }, [date]);

  const book = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.bookAppointment({
        patientId: user.id,
        doctorId: doctor.id,
        date,
        time,
        reason,
      });
      onBooked();
    } catch (x) {
      setErr(x.message);
      setTime("");
      loadSlots();
    } finally {
      // keep other fields, refresh slots
      setBusy(false);
    }
  };

  return (
    <Modal title={`Book ${doctor.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        {err && (
          <p
            role="alert"
            className="bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3"
          >
            {err}
          </p>
        )}
        <Field label="Date" required>
          <Input
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <div>
          <p className="text-xs font-semibold mb-2">Available time slots *</p>
          {!slots ? (
            <Loading />
          ) : slots.length === 0 ? (
            <p className="text-muted">
              {doctor.name} doesn’t work on this day. Choose another date.
            </p>
          ) : slots.every((s) => !s.available) ? (
            <p className="text-muted">
              No available slots. Choose another date.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setTime(s.time)}
                  aria-pressed={time === s.time}
                  className={`h-11 rounded-[10px] border tabular-nums ${time === s.time ? "bg-primary text-white border-primary" : "border-control bg-white hover:bg-softblue"} disabled:bg-[#EDF2F6] disabled:text-[#43586B] disabled:line-through disabled:cursor-not-allowed`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
        <Field label="Reason for visit" helper={`${reason.length}/300`}>
          <Textarea
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <div className="flex justify-between items-center">
          <p className="text-muted">
            Consultation fee{" "}
            <b className="text-ink tabular-nums">{inr(doctor.fee)}</b>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={!time} loading={busy} onClick={book}>
              Book appointment
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function FindDoctors() {
  const [depts, setDepts] = useState([]);
  const [docs, setDocs] = useState(null);
  const [dept, setDept] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    api.listDepartments().then(setDepts);
    api.listDoctors().then(setDocs);
  }, []);
  const shown = (docs || []).filter(
    (d) =>
      d.status !== "inactive" &&
      (!dept || d.deptId === dept) &&
      (d.name + d.specialty).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Find a doctor"
        description="Choose a doctor and pick a time that suits you."
      />
      {toast && (
        <p
          role="status"
          className="mb-4 bg-[#EAF6ED] text-[#24633A] rounded-lg p-3"
        >
          {toast}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <Field label="Search">
            <Input
              placeholder="Name or specialty"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </Field>
        </div>
        <div className="sm:w-64">
          <Field label="Department">
            <Select value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All departments</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
      {!docs ? (
        <Loading />
      ) : shown.length === 0 ? (
        <Card>
          <Empty title="No doctors match these filters.">
            Try another department.
          </Empty>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((d) => (
            <Card key={d.id}>
              <div className="flex gap-3">
                <div className="size-12 rounded-full bg-softblue text-primary grid place-items-center font-semibold">
                  {d.name.replace("Dr. ", "")[0]}
                </div>
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-muted">{d.specialty}</p>
                  <p className="text-xs text-muted">
                    {depts.find((x) => x.id === d.deptId)?.name}
                  </p>
                </div>
              </div>
              <dl className="mt-4 space-y-1 text-muted">
                <div className="flex justify-between">
                  <dt>Works</dt>
                  <dd className="text-ink">
                    {d.days.map((x) => DAYS[x]).join(", ")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Hours</dt>
                  <dd className="text-ink tabular-nums">
                    {d.start}–{d.end}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Fee</dt>
                  <dd className="text-ink tabular-nums">{inr(d.fee)}</dd>
                </div>
              </dl>
              <Button className="w-full mt-4" onClick={() => setPicked(d)}>
                View slots & book
              </Button>
            </Card>
          ))}
        </div>
      )}
      {picked && (
        <BookingModal
          doctor={picked}
          onClose={() => setPicked(null)}
          onBooked={() => {
            setPicked(null);
            setToast("Appointment booked.");
            setTimeout(() => setToast(""), 4000);
          }}
        />
      )}
    </>
  );
}
