import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { hospitalToday } from "../lib/clock.js";
import { validateRegistration } from "../lib/rules.js";
import { Button, Field, InlineError, Input, Select } from "../components/ui.jsx";
import { AuthIntro } from "./Login.jsx";

const EMPTY = { firstName: "", lastName: "", email: "", password: "", phone: "", dob: "", gender: "" };
const ORDER = Object.keys(EMPTY);

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);
  const today = hospitalToday();
  useEffect(() => { document.title = "Create account · Careflow"; }, []);
  if (user) return <Navigate to="/overview" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const next = validateRegistration(form, today);
    setErrors(next);
    setFormError(null);
    const first = ORDER.find((k) => next[k]);
    if (first) {
      formRef.current.querySelector(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    try {
      await register(form);
      toast("Account created.");
    } catch (err) {
      setFormError(err.message === "Already Registered" ? "An account with this email is already registered. Sign in instead." : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[45fr_55fr] bg-white">
      <AuthIntro />
      <main className="grid place-items-center p-6 sm:p-10">
        <div className="w-full max-w-[440px]">
          <h1 className="text-[28px] leading-9 font-semibold">Create your patient account</h1>
          <p className="text-muted mb-6">Book visits and see your prescriptions and bills.</p>
          <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
            <InlineError>{formError}</InlineError>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First name" required error={errors.firstName}><Input name="firstName" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} /></Field>
              <Field label="Last name" required error={errors.lastName}><Input name="lastName" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} /></Field>
            </div>
            <Field label="Email" required error={errors.email}><Input name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} /></Field>
            <Field label="Password" required error={errors.password} helper="At least 6 characters."><Input name="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} /></Field>
            <Field label="Phone" required error={errors.phone} helper="10 digits; +91 is optional."><Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="9000000001" value={form.phone} onChange={set("phone")} /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Date of birth" required error={errors.dob}><Input name="dob" type="date" max={today} value={form.dob} onChange={set("dob")} /></Field>
              <Field label="Gender" required error={errors.gender}>
                <Select name="gender" value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </Select>
              </Field>
            </div>
            <Button type="submit" className="w-full" pending={busy} pendingLabel="Creating account…">Create account</Button>
          </form>
          <p className="text-center mt-5">Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
          <p className="text-xs text-muted text-center mt-6">Demo access · fictional data</p>
        </div>
      </main>
    </div>
  );
}
