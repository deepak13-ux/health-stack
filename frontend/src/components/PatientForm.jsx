import { useState } from "react";
import * as admin from "../api/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "./ui";
import { Err } from "./ui2";

const blank = {
  name: "",
  dob: "",
  gender: "",
  bloodGroup: "Unknown",
  phone: "",
  email: "",
  address: "",
  allergies: "",
  emergency: { name: "", relationship: "", phone: "" },
};

export default function PatientForm({ patient, patients, onClose, onSaved }) {
  const [f, setF] = useState(
    patient
      ? {
          ...blank,
          ...patient,
          emergency: { ...blank.emergency, ...(patient.emergency || {}) },
        }
      : blank,
  );
  const [errs, setErrs] = useState({});
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setEm = (k) => (e) =>
    setF({ ...f, emergency: { ...f.emergency, [k]: e.target.value } });
  const phone = f.phone.replace(/\s/g, "").replace(/^\+91/, "");
  const dups = /^\d{10}$/.test(phone)
    ? patients.filter((p) => p.id !== patient?.id && p.phone === phone)
    : [];

  const validate = () => {
    const e = {};
    const em = f.emergency;
    if (f.name.trim().length < 2 || f.name.trim().length > 80)
      e.name = "Enter the full name (2–80 characters).";
    if (!f.dob || new Date(f.dob) > new Date())
      e.dob = "Select a valid date of birth.";
    if (!f.gender) e.gender = "Select a gender.";
    if (!/^\d{10}$/.test(phone)) e.phone = "Enter a valid phone number.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email.";
    if ((em.name || em.phone || em.relationship) && (!em.name || !em.phone))
      e.emergency = "Emergency contact needs a name and a phone number.";
    if (dups.length && !ack) e.dup = true;
    return e;
  };
  const submit = async () => {
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      onSaved(
        await admin.savePatient({
          ...f,
          name: f.name.trim(),
          phone,
          id: patient?.id,
        }),
        !patient,
      );
    } catch (x) {
      setErrs({ form: x.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      wide
      title={patient ? "Edit patient" : "Register patient"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <Err msg={errs.form} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name" required error={errs.name}>
            <Input value={f.name} onChange={set("name")} />
          </Field>
          <Field label="Date of birth" required error={errs.dob}>
            <Input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={f.dob}
              onChange={set("dob")}
            />
          </Field>
          <Field label="Gender" required error={errs.gender}>
            <Select value={f.gender} onChange={set("gender")}>
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
              <option>Other</option>
              <option>Prefer not to say</option>
            </Select>
          </Field>
          <Field label="Blood group">
            <Select value={f.bloodGroup} onChange={set("bloodGroup")}>
              {[
                "Unknown",
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-",
              ].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Phone" required error={errs.phone}>
            <Input
              inputMode="numeric"
              value={f.phone}
              onChange={set("phone")}
              placeholder="9000000001"
            />
          </Field>
          <Field
            label="Email"
            required
            error={errs.email}
            helper={
              patient ? "" : "Used for login. Initial password: welcome123"
            }
          >
            <Input type="email" value={f.email} onChange={set("email")} />
          </Field>
        </div>
        {dups.length > 0 && (
          <div className="bg-[#FFF4D6] text-[#785400] rounded-lg p-3">
            <p>
              This phone matches:{" "}
              <b>{dups.map((d) => `${d.name} (${d.mrn})`).join(", ")}</b>
            </p>
            <label className="flex gap-2 mt-2 items-center">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />{" "}
              Continue as separate patient
            </label>
            {errs.dup && (
              <p role="alert" className="text-[#A12B35]">
                Confirm this is a separate patient to continue.
              </p>
            )}
          </div>
        )}
        <Field label="Address">
          <Textarea value={f.address} onChange={set("address")} />
        </Field>
        <fieldset className="border border-line rounded-xl p-3">
          <legend className="text-xs font-semibold px-1">
            Emergency contact (optional)
          </legend>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Name">
              <Input value={f.emergency.name} onChange={setEm("name")} />
            </Field>
            <Field label="Relationship">
              <Input
                value={f.emergency.relationship}
                onChange={setEm("relationship")}
              />
            </Field>
            <Field label="Phone">
              <Input value={f.emergency.phone} onChange={setEm("phone")} />
            </Field>
          </div>
          {errs.emergency && (
            <p role="alert" className="text-xs text-[#A12B35] mt-1">
              {errs.emergency}
            </p>
          )}
        </fieldset>
        <Field
          label="Allergies"
          helper="Empty means “Not recorded”, not “No known allergies”."
        >
          <Textarea value={f.allergies} onChange={set("allergies")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} onClick={submit}>
            {patient ? "Save changes" : "Register patient"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
