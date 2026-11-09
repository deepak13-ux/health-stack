import { createContext, useContext, useState } from "react";
import * as api from "../api/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getSession());
  const value = {
    user,
    login: async (e, p) => setUser(await api.login(e, p)),
    register: async (d) => setUser(await api.registerPatient(d)),
    logout: () => {
      api.logout();
      setUser(null);
    },
    refresh: () => setUser(api.getSession()),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const homeFor = (u) =>
  u?.role === "patient"
    ? "/patient"
    : ["admin", "receptionist"].includes(u?.role)
      ? "/admin"
      : "/staff";
