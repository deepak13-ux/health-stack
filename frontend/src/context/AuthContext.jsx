import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/index.js";
import { Button } from "../components/ui.jsx";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    api.getSession().then(
      (current) => { if (active) { setUser(current); setStatus("ready"); } },
      (e) => {
        if (!active) return;
        // An expired session is not an error: show sign-in.
        if (e.status === 401) { setUser(null); setStatus("ready"); }
        else { setError(e); setStatus("error"); }
      },
    );
    return () => { active = false; };
  }, [attempt]);

  useEffect(() => {
    const clear = () => setUser(null);
    window.addEventListener("careflow:unauthorized", clear);
    return () => window.removeEventListener("careflow:unauthorized", clear);
  }, []);

  const value = useMemo(() => ({
    user,
    async login(email, password, role) {
      setUser(await api.login(email, password, role));
    },
    async register(data) {
      setUser(await api.registerPatient(data));
    },
    async logout() {
      try { await api.logout(); } catch { /* the local session is cleared either way */ }
      setUser(null);
    },
  }), [user]);

  if (status === "loading") {
    return <p role="status" className="p-8 text-muted">Connecting to Careflow…</p>;
  }
  if (status === "error") {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div role="alert" className="max-w-md bg-white border border-line rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-semibold">Careflow couldn't start</h1>
          <p className="text-muted">{error.message}</p>
          <Button onClick={() => { setStatus("loading"); setAttempt((n) => n + 1); }}>Retry</Button>
        </div>
      </main>
    );
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
