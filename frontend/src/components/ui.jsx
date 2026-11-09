import { useEffect } from "react";
import { X } from "lucide-react";

export function Button({
  variant = "primary",
  loading,
  className = "",
  children,
  ...p
}) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-hover",
    secondary: "bg-white text-ink border border-control hover:bg-softblue",
    lime: "bg-lime text-lime-ink hover:brightness-95",
    danger:
      "bg-white text-[#A12B35] border border-[#A12B35] hover:bg-[#FDEDEE]",
    ghost: "text-primary hover:bg-softblue",
  };
  return (
    <button
      {...p}
      disabled={loading || p.disabled}
      className={`h-11 px-4 rounded-[10px] font-medium inline-flex items-center justify-center gap-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-[#EDF2F6] disabled:text-[#43586B] disabled:border-transparent ${styles[variant]} ${className}`}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Field({ label, error, helper, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">
        {label}
        {required && <span className="text-[#A12B35]"> *</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error ? (
        <span role="alert" className="text-xs text-[#A12B35]">
          {error}
        </span>
      ) : (
        helper && <span className="text-xs text-muted">{helper}</span>
      )}
    </label>
  );
}
export const inputCls =
  "w-full h-11 px-3 rounded-[10px] border border-control bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
export const Input = (p) => (
  <input {...p} className={`${inputCls} ${p.className || ""}`} />
);
export const Select = ({ children, ...p }) => (
  <select {...p} className={`${inputCls} ${p.className || ""}`}>
    {children}
  </select>
);
export const Textarea = (p) => (
  <textarea
    {...p}
    className="w-full min-h-24 p-3 rounded-[10px] border border-control focus-visible:outline-2 focus-visible:outline-primary"
  />
);

const BADGES = {
  scheduled: ["Scheduled", "bg-[#EDF2F6] text-[#43586B]"],
  checked_in: ["Checked in", "bg-[#FFF4D6] text-[#785400]"],
  in_consultation: ["In consultation", "bg-softblue text-primary"],
  completed: ["Completed", "bg-[#EAF6ED] text-[#24633A]"],
  cancelled: ["Cancelled", "bg-[#FDEDEE] text-[#A12B35]"],
  no_show: ["No-show", "bg-[#FDEDEE] text-[#A12B35]"],
  paid: ["Paid", "bg-[#EAF6ED] text-[#24633A]"],
  unpaid: ["Unpaid", "bg-[#FFF4D6] text-[#785400]"],
  partial: ["Partially paid", "bg-[#FFF4D6] text-[#785400]"],
  overdue: ["Overdue", "bg-[#FDEDEE] text-[#A12B35]"],
  draft: ["Draft", "bg-[#EDF2F6] text-[#43586B]"],
  void: ["Void", "bg-[#EDF2F6] text-[#43586B]"],
  active: ["Admitted", "bg-softblue text-primary"],
  discharged: ["Discharged", "bg-[#EAF6ED] text-[#24633A]"],
  available: ["Available", "bg-[#EAF6ED] text-[#24633A]"],
  occupied: ["Occupied", "bg-softblue text-primary"],
  maintenance: ["Maintenance", "bg-[#FFF4D6] text-[#785400]"],
  archived: ["Archived", "bg-[#EDF2F6] text-[#43586B]"],
  inactive: ["Inactive", "bg-[#EDF2F6] text-[#43586B]"],
};
export function Badge({ status }) {
  const [text, cls] = BADGES[status] || [status, BADGES.scheduled[1]];
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}
    >
      {text}
    </span>
  );
}

export const Card = ({ title, action, className = "", children }) => (
  <section className={`bg-white border border-line rounded-2xl ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const PageHeader = ({ title, description, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
    <div>
      <h1 className="text-[28px] leading-9 font-semibold">{title}</h1>
      {description && <p className="text-muted">{description}</p>}
    </div>
    {action}
  </div>
);

export const Stat = ({ label, value, hint, icon: Icon }) => (
  <div className="bg-white border border-line rounded-2xl p-5 flex justify-between">
    <div>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="text-[30px] leading-[38px] font-semibold tabular-nums">
        {value}
      </p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
    {Icon && (
      <div className="size-10 rounded-xl bg-softblue text-primary grid place-items-center">
        <Icon size={20} />
      </div>
    )}
  </div>
);

export const Empty = ({ title, children }) => (
  <div className="text-center py-10">
    <p className="font-semibold">{title}</p>
    <div className="text-muted mt-1">{children}</div>
  </div>
);

export const Loading = () => (
  <p aria-busy="true" className="text-muted py-8 text-center">
    Loading…
  </p>
);

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 grid place-items-center p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white rounded-[20px] w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-auto`}
      >
        <div className="flex items-center justify-between p-5 border-b border-line">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="size-9 grid place-items-center rounded-lg hover:bg-softblue"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Table = ({ caption, heads, children }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="text-xs text-muted border-b border-line">
          {heads.map((h) => (
            <th key={h} scope="col" className="py-2 pr-4 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="[&_td]:py-3 [&_td]:pr-4 [&_tr]:border-b [&_tr]:border-line [&_tr:hover]:bg-[#F3F8FC]">
        {children}
      </tbody>
    </table>
  </div>
);

export const inr = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export const fmtDate = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
