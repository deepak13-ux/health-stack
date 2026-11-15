import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CalendarCheck2, Pill, Plus, Receipt } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { Button, Field, InlineError, Input } from "../components/ui.jsx";

const ROLES = [
  { value: "patient", label: "Patient" },
  { value: "doctor", label: "Doctor" },
  { value: "pharmacist", label: "Pharmacist" },
];
// Seeded fictional accounts from backend/seed/seed.sql (password demo123).
const DEMO = { patient: "patient@demo.com", doctor: "doctor@demo.com", pharmacist: "pharmacist@demo.com" };

export function AuthIntro() {
  return (
    <div className="hidden lg:flex flex-col justify-center bg-surface-blue px-16 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-12">
        <span className="size-9 rounded-[10px] bg-primary text-white grid place-items-center" aria-hidden="true"><Plus size={20} strokeWidth={2.5} /></span>
        <span className="text-xl font-semibold">Careflow</span>
      </div>
      <p className="text-4xl leading-[44px] font-semibold max-w-sm">A clearer day at the hospital.</p>
      <ul className="mt-8 space-y-4 text-ink">
        {[[CalendarCheck2, "Appointments coordinated"], [Pill, "Prescriptions recorded"], [Receipt, "Billing connected"]].map(([Icon, text]) => (
          <li key={text} className="flex items-center gap-3">
            <span className="size-9 rounded-xl bg-white text-primary grid place-items-center" aria-hidden="true"><Icon size={18} /></span>
            {text}
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="absolute -bottom-10 -right-10 size-40 rounded-[40px] bg-lime rotate-12" />
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ role: "patient", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef(null);
  useEffect(() => { document.title = "Sign in · Careflow"; }, []);
  useEffect(() => { if (formError) errorRef.current?.querySelector("[role=alert]")?.focus(); }, [formError]);
  if (user) return <Navigate to={location.state?.from || "/overview"} replace />;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await login(form.email.trim(), form.password, form.role);
    } catch (err) {
      setFormError(err.status === 401 ? `${err.message} Check the email, password and role.` : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[45fr_55fr] bg-white">
      <AuthIntro />
      <main className="grid place-items-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <span className="size-9 rounded-[10px] bg-primary text-white grid place-items-center" aria-hidden="true"><Plus size={20} strokeWidth={2.5} /></span>
            <span className="text-xl font-semibold">Careflow</span>
          </div>
          <h1 className="text-[28px] leading-9 font-semibold">Welcome to Careflow</h1>
          <p className="text-muted mb-6">Careflow Community Hospital</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <div ref={errorRef}><InlineError>{formError}</InlineError></div>
            <fieldset>
              <legend className="text-xs leading-[18px] font-semibold mb-1">Sign in as</legend>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-[12px] bg-canvas border border-line">
                {ROLES.map((r) => (
                  <label key={r.value}>
                    <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={() => set({ role: r.value })} className="peer sr-only" />
                    <span className="h-10 grid place-items-center rounded-[10px] font-medium text-muted peer-checked:bg-white peer-checked:text-primary peer-checked:shadow-[0_0_0_1px_var(--blue-border)] peer-focus-visible:outline-2 peer-focus-visible:outline-primary">{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label="Email" required error={errors.email}>
              <Input type="email" autoComplete="username" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Password" required error={errors.password}>
              <Input type="password" autoComplete="current-password" value={form.password} onChange={(e) => set({ password: e.target.value })} />
            </Field>
            <Button type="submit" className="w-full" pending={busy} pendingLabel="Signing in…">Sign in</Button>
          </form>
          <p className="text-center mt-5">
            New patient? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
          <details className="mt-6 border border-line rounded-xl p-3 text-muted">
            <summary className="font-medium text-ink">Use a demo account</summary>
            <p className="mt-2">Seeded fictional accounts share the password <code className="text-ink">demo123</code>.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <Button key={r.value} size="sm" variant="secondary" onClick={() => set({ role: r.value, email: DEMO[r.value], password: "demo123" })}>
                  Fill {r.label.toLowerCase()}
                </Button>
              ))}
            </div>
          </details>
          <p className="text-xs text-muted text-center mt-6">Demo access · fictional data</p>
        </div>
      </main>
    </div>
  );
}
