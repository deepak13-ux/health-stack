import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Stethoscope,
  CalendarDays,
  FileText,
  LogOut,
  Plus,
  Receipt,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = {
  patient: [
    { to: "/patient", label: "Home", icon: Home, end: true },
    { to: "/patient/doctors", label: "Find doctors", icon: Stethoscope },
    { to: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/patient/records", label: "Prescriptions & bills", icon: FileText },
  ],
  doctor: [{ to: "/staff", label: "Today's patients", icon: CalendarDays, end: true }],
  pharmacist: [{ to: "/pharmacy", label: "Prescriptions & payments", icon: Receipt, end: true }],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = NAV[user.role] || [];
  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-white"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 w-20 lg:w-[232px] bg-white border-r border-line flex flex-col">
        <div className="flex items-center gap-3 px-4 h-[72px]">
          <div className="size-9 rounded-[10px] bg-primary text-white grid place-items-center shrink-0">
            <Plus size={20} />
          </div>
          <div className="hidden lg:block">
            <p className="text-xl font-semibold leading-5">Careflow</p>
            <p className="text-[11px] text-muted">Hospital workspace</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-1" aria-label="Main">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                `h-11 flex items-center gap-3 px-3 rounded-[10px] ${isActive ? "bg-softblue text-primary font-semibold shadow-[inset_3px_0_0_#1768AC]" : "hover:bg-canvas"}`
              }
            >
              <Icon size={20} />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 hidden lg:block">
          <div className="bg-lime/50 rounded-xl p-3 text-lime-ink text-xs">
            <p className="font-semibold">Hospital workspace</p>
            <p>Connected to server</p>
          </div>
        </div>
      </aside>
      <div className="ml-20 lg:ml-[232px]">
        <header className="h-[72px] bg-white border-b border-line flex items-center justify-between px-6">
          <p className="text-muted capitalize">{user.role} portal</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted hidden sm:inline">
              Asia/Kolkata
            </span>
            <div className="flex items-center gap-2">
              <div className="size-9 rounded-full bg-softblue text-primary grid place-items-center font-semibold">
                {user.name.replace(/^(Dr\.|Nurse)\s/, "")[0]}
              </div>
              <span className="hidden sm:inline font-medium">{user.name}</span>
            </div>
            <button
              onClick={() => {
                logout().finally(() => nav("/login"));
              }}
              aria-label="Sign out"
              className="size-10 grid place-items-center rounded-lg hover:bg-softblue"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main id="main" className="min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
