import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../context/AuthContext";
import { Button, Field, Input, Select } from "../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "", role: "patient" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(f.email, f.password, f.role);
      nav("/");
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[45fr_55fr]">
      <div className="hidden lg:flex flex-col justify-center bg-softblue p-16">
        <p className="text-2xl font-semibold mb-6">Careflow</p>
        <h1 className="text-4xl font-semibold max-w-sm">
          A clearer day at the hospital.
        </h1>
        <ul className="mt-6 space-y-2 text-muted">
          <li>Book doctors on your own time</li>
          <li>Prescriptions and bills in one place</li>
          <li>Staff schedules, coordinated</li>
        </ul>
        <div className="mt-10 w-24 h-10 rounded-full bg-lime" />
      </div>
      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-[400px] space-y-4">
          <h2 className="text-[28px] font-semibold">Welcome to Careflow</h2>
          <p className="text-muted -mt-2">Careflow Community Hospital</p>
          {err && (
            <p
              role="alert"
              className="bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3"
            >
              {err}
            </p>
          )}
          <Field label="Sign in as">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacist">Pharmacist</option>
            </Select>
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
              required
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              required
            />
          </Field>
          <Button className="w-full" loading={busy}>
            Sign in
          </Button>
          <p className="text-center">
            New patient?{" "}
            <Link className="text-primary font-medium" to="/register">
              Create an account
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
}
