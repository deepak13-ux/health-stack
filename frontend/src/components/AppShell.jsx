import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, Pill, Plus, Receipt, Settings, Stethoscope, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { displayId, initials } from "../lib/rules.js";
import { ErrorBoundary } from "./ErrorBoundary.jsx";

const NAV = {
  patient: [
    { to: "/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/appointments", label: "Appointments", icon: CalendarDays },
    { to: "/doctors", label: "Doctors", icon: Stethoscope },
    { to: "/prescriptions", label: "Prescriptions", icon: Pill },
    { to: "/billing", label: "Billing", icon: Receipt },
  ],
  doctor: [
    { to: "/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/appointments", label: "Today's appointments", icon: CalendarDays },
  ],
  pharmacist: [
    { to: "/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/billing", label: "Pending bills", icon: Receipt },
  ],
};
const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", pharmacist: "Pharmacist" };
const DETAIL = { appointments: (id) => displayId("A", id), billing: (id) => displayId("B", id), doctors: () => "Doctor profile" };

function crumbs(pathname, role) {
  const [section, id] = pathname.split("/").filter(Boolean);
  const nav = [...(NAV[role] || []), { to: "/settings", label: "Settings" }].find((n) => n.to === `/${section}`);
  if (!nav) return [];
  const list = [{ to: nav.to, label: nav.label }];
  if (id && DETAIL[section]) list.push({ label: DETAIL[section](id) });
  return list;
}

function Logo({ compact }) {
  return (
    <Link to="/overview" className="flex items-center gap-3 rounded-[10px]" aria-label="Careflow overview">
      <span className="size-9 rounded-[10px] bg-primary text-white grid place-items-center shrink-0" aria-hidden="true"><Plus size={20} strokeWidth={2.5} /></span>
      {!compact && (
        <span>
          <span className="block text-xl leading-6 font-semibold">Careflow</span>
          <span className="block text-[11px] leading-4 text-muted">Hospital workspace</span>
        </span>
      )}
    </Link>
  );
}

function NavItems({ items, rail, onNavigate }) {
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink key={to} to={to} onClick={onNavigate} title={rail ? label : undefined} aria-label={rail ? label : undefined}
      className={({ isActive }) =>
        `h-11 flex items-center gap-3 rounded-[10px] transition-colors ${rail ? "justify-center" : "px-3"} ${isActive ? "bg-surface-blue text-primary font-semibold shadow-[inset_3px_0_0_var(--primary)]" : "text-ink hover:bg-canvas"}`}>
      <Icon size={20} aria-hidden="true" className="shrink-0" />
      {!rail && <span className="truncate">{label}</span>}
    </NavLink>
  ));
}

function SidebarBody({ user, rail, onNavigate }) {
  const items = NAV[user.role] || [];
  return (
    <>
      <div className={`h-[72px] flex items-center ${rail ? "justify-center" : "px-5"} shrink-0`}><Logo compact={rail} /></div>
      <nav aria-label="Main" className={`flex-1 overflow-y-auto ${rail ? "px-3" : "px-4"} pt-2 flex flex-col gap-1`}>
        <NavItems items={items} rail={rail} onNavigate={onNavigate} />
        <div className="mt-auto pt-4">
          <NavItems items={[{ to: "/settings", label: "Settings", icon: Settings }]} rail={rail} onNavigate={onNavigate} />
        </div>
      </nav>
      {!rail && (
        <div className="p-4 space-y-3">
          <div className="rounded-xl bg-lime/40 border border-lime p-3 text-lime-ink">
            <p className="text-xs font-semibold">Demo workspace</p>
            <p className="text-[11px] leading-4">Fictional data · Careflow Community Hospital</p>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span aria-hidden="true" className="size-9 rounded-full bg-surface-blue text-primary grid place-items-center text-sm font-semibold shrink-0">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AvatarMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const button = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") { setOpen(false); button.current?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={wrap} className="relative">
      <button ref={button} type="button" aria-expanded={open} aria-haspopup="true" aria-label={`Account menu for ${user.name}`} onClick={() => setOpen((o) => !o)}
        className="h-11 flex items-center gap-2 pl-1 pr-2 rounded-[10px] hover:bg-surface-blue">
        <span aria-hidden="true" className="size-9 rounded-full bg-surface-blue text-primary grid place-items-center text-sm font-semibold">{initials(user.name)}</span>
        <span className="hidden md:block font-medium max-w-40 truncate">{user.name}</span>
        <ChevronDown size={16} aria-hidden="true" className="text-muted" />
      </button>
      {open && (
        <div className="cf-enter absolute right-0 mt-2 w-60 bg-white border border-line rounded-xl shadow-float p-2 z-40">
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{ROLE_LABEL[user.role]}{user.email ? ` · ${user.email}` : ""}</p>
          </div>
          <Link to="/settings" onClick={() => setOpen(false)} className="h-11 flex items-center gap-3 px-3 rounded-[10px] hover:bg-surface-blue">
            <UserRound size={18} aria-hidden="true" /> My profile
          </Link>
          <button type="button" onClick={onSignOut} className="w-full h-11 flex items-center gap-3 px-3 rounded-[10px] hover:bg-surface-blue text-left">
            <LogOut size={18} aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef(null);
  const trail = crumbs(pathname, user.role);

  useEffect(() => {
    if (!drawer) return undefined;
    const el = drawerRef.current;
    el.querySelector("a,button")?.focus();
    const onKey = (e) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[70] focus:top-3 focus:left-3 focus:bg-white focus:px-4 focus:py-2 focus:rounded-[10px] focus:shadow-float">Skip to content</a>

      {/* ≥1280: full sidebar; 1024–1279: icon rail */}
      <aside className="no-print hidden lg:flex fixed inset-y-0 left-0 z-30 w-20 xl:w-[232px] bg-white border-r border-line flex-col">
        <div className="hidden xl:flex flex-col h-full"><SidebarBody user={user} /></div>
        <div className="flex xl:hidden flex-col h-full"><SidebarBody user={user} rail /></div>
      </aside>

      {/* <1024: drawer */}
      {drawer && (
        <div className="no-print lg:hidden fixed inset-0 z-50 bg-ink/40" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation" className="cf-enter w-[272px] max-w-[85vw] h-full bg-white flex flex-col relative">
            <button type="button" onClick={() => setDrawer(false)} aria-label="Close navigation" className="absolute right-3 top-4 size-10 grid place-items-center rounded-lg hover:bg-surface-blue z-10"><X size={20} aria-hidden="true" /></button>
            <SidebarBody user={user} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-20 xl:pl-[232px] print:pl-0">
        <header className="no-print sticky top-0 z-20 h-14 md:h-[72px] bg-white border-b border-line flex items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Open navigation" className="lg:hidden size-11 -ml-2 grid place-items-center rounded-[10px] hover:bg-surface-blue"><Menu size={20} aria-hidden="true" /></button>
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-muted min-w-0">
                {trail.map((c, i) => (
                  <li key={c.label} className="flex items-center gap-1.5 min-w-0">
                    {i > 0 && <ChevronRight size={14} aria-hidden="true" className="shrink-0" />}
                    {c.to && i < trail.length - 1
                      ? <Link to={c.to} className="hover:text-ink truncate">{c.label}</Link>
                      : <span aria-current="page" className="text-ink font-medium truncate tabular-nums">{c.label}</span>}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-xs text-muted">Asia/Kolkata</span>
            <AvatarMenu user={user} onSignOut={signOut} />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="print-reset px-4 py-6 md:p-6 xl:p-8 max-w-[1440px] mx-auto outline-none">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
