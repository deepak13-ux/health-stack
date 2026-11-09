import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Stethoscope,
  CalendarDays,
  FileText,
  BedDouble,
  Briefcase,
  LogOut,
  Plus,
  Users,
  UserCog,
  Receipt,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = {
  patient: [
    { to: "/patient", label: "Home", icon: Home, end: true },
    { to: "/patient/doctors", label: "Find doctors", icon: Stethoscope },
    {
      to: "/patient/appointments",
      label: "My appointments",
      icon: CalendarDays,
    },
    { to: "/patient/records", label: "Prescriptions & bills", icon: FileText },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: Home, end: true },
    { to: "/admin/patients", label: "Patients", icon: Users },
    { to: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/admin/employees", label: "Employees", icon: UserCog },
    { to: "/admin/admissions", label: "Admissions & beds", icon: BedDouble },
    { to: "/admin/billing", label: "Billing", icon: Receipt },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  ],
  doctor: [
    { to: "/staff", label: "Overview", icon: Home, end: true },
    { to: "/staff/schedule", label: "My schedule", icon: CalendarDays },
    { to: "/staff/admissions", label: "Admitted patients", icon: BedDouble },
    { to: "/staff/employment", label: "My employment", icon: Briefcase },
  ],
  nurse: [
    { to: "/staff", label: "Overview", icon: Home, end: true },
    { to: "/staff/schedule", label: "All appointments", icon: CalendarDays },
    { to: "/staff/admissions", label: "Admitted patients", icon: BedDouble },
    { to: "/staff/employment", label: "My employment", icon: Briefcase },
  ],
};
NAV.receptionist = NAV.admin.filter(
  (i) => !["Employees", "Reports"].includes(i.label),
);

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = [
    ...NAV[user.role],
    { to: "/settings", label: "Settings", icon: Settings },
  ];
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
        <nav className="flex-1 px-4 space-y-1" aria-label="Main">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
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
            <p className="font-semibold">Demo workspace</p>
            <p>Fictional data</p>
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
                logout();
                nav("/login");
              }}
              aria-label="Sign out"
              className="size-10 grid place-items-center rounded-lg hover:bg-softblue"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main id="main" className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
