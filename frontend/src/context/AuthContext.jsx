import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const clear = () => setUser(null);
    window.addEventListener('careflow:unauthorized', clear);
    api.getSession().then((current) => {
      if (active) setUser(current);
    }).catch((e) => {
      if (active) setError(e.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      window.removeEventListener('careflow:unauthorized', clear);
    };
  }, []);
  const value = {
    user,
    login: async (email, password, role) => {
      setUser(await api.login(email, password, role));
      setError('');
    },
    register: async (data) => setUser(await api.registerPatient(data)),
    logout: async () => {
      try { await api.logout(); }
      catch (e) { setError(e.message); }
      finally { setUser(null); }
    },
  };
  if (loading) return <p className="p-6 text-muted" role="status">Connecting to server…</p>;
  return <Ctx.Provider value={value}>
    {error && <p role="alert" className="p-3 bg-[#FDEDEE] text-[#A12B35]">{error}</p>}
    {children}
  </Ctx.Provider>;
}

export const homeFor = (user) => user?.role === 'patient' ? '/patient' : user?.role === 'pharmacist' ? '/pharmacy' : '/staff';
