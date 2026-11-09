import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Field, Input, Select } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dob: "",
    gender: "",
  });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email.";
    if (f.password.length < 6) e.password = "Use at least 6 characters.";
    if (!/^(\+91)?\d{10}$/.test(f.phone))
      e.phone = "Enter a valid 10-digit phone number.";
    if (!f.dob || new Date(f.dob) > new Date())
      e.dob = "Select a valid date of birth.";
    if (!f.gender) e.gender = "Select a gender.";
    return e;
  };
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await register({ ...f, name: f.name.trim() });
      nav("/");
    } catch (x) {
      setErrs({ form: x.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-[440px] bg-white border border-line rounded-[20px] p-6 space-y-4"
      >
        <h1 className="text-[28px] font-semibold">Create your account</h1>
        {errs.form && (
          <p
            role="alert"
            className="bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3"
          >
            {errs.form}
          </p>
        )}
        <Field label="Full name" required error={errs.name}>
          <Input value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Email" required error={errs.email}>
          <Input type="email" value={f.email} onChange={set("email")} />
        </Field>
        <Field label="Password" required error={errs.password}>
          <Input
            type="password"
            value={f.password}
            onChange={set("password")}
          />
        </Field>
        <Field label="Phone" required error={errs.phone}>
          <Input
            inputMode="numeric"
            value={f.phone}
            onChange={set("phone")}
            placeholder="9000000001"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
            </Select>
          </Field>
        </div>
        <Button className="w-full" loading={busy}>
          Create account
        </Button>
        <p className="text-center">
          Already registered?{" "}
          <Link className="text-primary font-medium" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
