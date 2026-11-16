import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Loader2, Search, X } from "lucide-react";
import { initials } from "../lib/rules.js";

// ---------- Buttons
const BUTTON = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-pressed",
  secondary: "bg-white text-ink border border-control hover:bg-surface-blue",
  ghost: "text-primary hover:bg-surface-blue",
  danger: "bg-white text-danger-ink border border-danger-ink hover:bg-danger-bg",
  "danger-solid": "bg-danger-ink text-white hover:brightness-110",
  lime: "bg-lime text-lime-ink hover:bg-lime-hover",
};
const SIZE = { md: "h-11 px-4", sm: "h-9 px-3 text-[13px]" };
export const buttonClass = (variant = "primary", size = "md", className = "") =>
  `${SIZE[size]} rounded-[10px] font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-neutral-bg disabled:text-neutral-ink disabled:border-transparent ${BUTTON[variant]} ${className}`;

export function Button({ variant = "primary", size = "md", pending, pendingLabel, className = "", children, type = "button", ...props }) {
  return (
    <button type={type} {...props} disabled={pending || props.disabled} aria-busy={pending || undefined} className={buttonClass(variant, size, className)}>
      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className = "", ...props }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

// ---------- Form fields
export function Field({ label, error, helper, required, children, className = "", hideLabel }) {
  const id = useId();
  const child = Children.only(children);
  const describedBy = error || helper ? `${id}-desc` : undefined;
  const control = isValidElement(child)
    ? cloneElement(child, {
        id: child.props.id || id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required || undefined,
      })
    : child;
  return (
    <div className={className}>
      <label htmlFor={child.props?.id || id} className={hideLabel ? "sr-only" : "block text-xs leading-[18px] font-semibold mb-1"}>
        {label}
        {required && <span className="text-danger-ink" aria-hidden="true"> *</span>}
      </label>
      {control}
      {error ? (
        <p id={describedBy} className="text-xs leading-[18px] text-danger-ink mt-1">{error}</p>
      ) : helper ? (
        <p id={describedBy} className="text-xs leading-[18px] text-muted mt-1">{helper}</p>
      ) : null}
    </div>
  );
}

const control = "w-full h-11 px-3 rounded-[10px] border border-control bg-white text-ink placeholder:text-muted/80 aria-[invalid=true]:border-danger-ink disabled:bg-neutral-bg";
export const Input = ({ className = "", ...p }) => <input {...p} className={`${control} ${className}`} />;
export const Select = ({ className = "", children, ...p }) => <select {...p} className={`${control} pr-8 ${className}`}>{children}</select>;
export const Textarea = ({ className = "", ...p }) => (
  <textarea {...p} className={`w-full min-h-24 p-3 rounded-[10px] border border-control bg-white aria-[invalid=true]:border-danger-ink ${className}`} />
);

export function SearchInput({ label, value, onChange, placeholder, className = "" }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) { setSynced(value); setText(value); }
  const latest = useRef(onChange);
  useEffect(() => { latest.current = onChange; }, [onChange]);
  useEffect(() => {
    if (text === value) return undefined;
    const t = setTimeout(() => latest.current(text), 250);
    return () => clearTimeout(t);
  }, [text, value]);
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <Search size={18} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input id={id} type="search" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)}
        className={`${control} pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`} />
      {text && (
        <button type="button" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => { setText(""); onChange(""); }}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 size-8 grid place-items-center rounded-lg text-muted hover:bg-surface-blue">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ---------- Status
const BADGE = {
  scheduled: ["Scheduled", "bg-neutral-bg text-neutral-ink"],
  completed: ["Completed", "bg-success-bg text-success-ink"],
  cancelled: ["Cancelled", "bg-danger-bg text-danger-ink"],
  paid: ["Paid", "bg-success-bg text-success-ink"],
  unpaid: ["Unpaid", "bg-warning-bg text-warning-ink"],
  running: ["Running", "bg-success-bg text-success-ink"],
  expired: ["Expired", "bg-neutral-bg text-neutral-ink"],
  waiting: ["Waiting", "bg-warning-bg text-warning-ink"],
};
export function StatusBadge({ status, label }) {
  const [text, cls] = BADGE[status] || [status, BADGE.scheduled[1]];
  return <span className={`inline-flex items-center px-2.5 h-6 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>{label || text}</span>;
}

// ---------- Layout pieces
export function PageHeader({ title, description, primary, secondary, children }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {children}
        <h1 className="text-2xl leading-8 sm:text-[28px] sm:leading-9 font-semibold">{title}</h1>
        {description && <p className="text-muted mt-1">{description}</p>}
      </div>
      {(primary || secondary) && (
        <div className="flex flex-col-reverse sm:flex-row gap-2 shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
          {secondary}
          {primary}
        </div>
      )}
    </header>
  );
}

export function Card({ title, action, className = "", bodyClass = "p-5", tone = "white", headingLevel = 2, children, id }) {
  const H = `h${headingLevel}`;
  const tones = { white: "bg-white border-line", blue: "bg-surface-blue border-blue-border" };
  return (
    <section aria-labelledby={title ? `${id || title}-title` : undefined} className={`border rounded-2xl min-w-0 ${tones[tone]} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          {title && <H id={`${id || title}-title`} className="text-lg leading-[26px] font-semibold">{title}</H>}
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function MetricCard({ label, value, hint, icon: Icon, to }) {
  const body = (
    <>
      <div className="min-w-0">
        <p className="text-xs leading-[18px] font-semibold text-muted">{label}</p>
        <p className="text-[30px] leading-[38px] font-semibold tabular-nums mt-1 truncate">{value}</p>
        {hint && <p className="text-xs leading-[18px] text-muted mt-1">{hint}</p>}
      </div>
      {Icon && (
        <span className="size-10 rounded-xl bg-surface-blue text-primary grid place-items-center shrink-0" aria-hidden="true">
          <Icon size={20} />
        </span>
      )}
    </>
  );
  const cls = "bg-white border border-line rounded-2xl p-5 flex justify-between gap-3 min-h-[116px]";
  return to ? <Link to={to} className={`${cls} hover:border-blue-border hover:bg-row-hover transition-colors`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function PersonIdentity({ name, secondary, size = "md", to }) {
  const dims = size === "lg" ? "size-14 text-lg" : size === "sm" ? "size-8 text-xs" : "size-10 text-sm";
  const nameEl = to ? <Link to={to} className="font-semibold text-primary hover:underline">{name}</Link> : <span className="font-semibold">{name}</span>;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span aria-hidden="true" className={`${dims} rounded-full bg-surface-blue text-primary grid place-items-center font-semibold shrink-0`}>{initials(name)}</span>
      <div className="min-w-0">
        <div className="truncate">{nameEl}</div>
        {secondary && <div className="text-xs leading-[18px] text-muted truncate tabular-nums">{secondary}</div>}
      </div>
    </div>
  );
}

export function DefinitionList({ items }) {
  return (
    <dl className="space-y-3">
      {items.filter(Boolean).map(([term, value]) => (
        <div key={term}>
          <dt className="text-xs leading-[18px] font-semibold text-muted">{term}</dt>
          <dd className="mt-0.5 break-words">{value ?? <span className="text-muted">Not recorded</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- States
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="text-center py-10 px-4">
      {Icon && <span className="mx-auto mb-3 size-12 rounded-2xl bg-surface-blue text-primary grid place-items-center" aria-hidden="true"><Icon size={22} /></span>}
      <p className="font-semibold">{title}</p>
      {children && <div className="text-muted mt-1 max-w-md mx-auto">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = "We couldn't load this." }) {
  return (
    <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 bg-danger-bg text-danger-ink rounded-2xl p-4">
      <AlertTriangle size={20} aria-hidden="true" className="shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p>{error?.message || String(error)}</p>
      </div>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function InlineError({ children }) {
  if (!children) return null;
  return <p role="alert" tabIndex={-1} className="bg-danger-bg text-danger-ink rounded-[10px] p-3">{children}</p>;
}

export function Skeleton({ rows = 4, label = "Loading" }) {
  return (
    <div aria-busy="true" aria-label={label} role="status" className="space-y-3 py-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="cf-skeleton h-10 rounded-[10px] bg-neutral-bg" style={{ width: `${100 - (i % 3) * 12}%` }} />
      ))}
    </div>
  );
}

// ---------- Tabs (controlled; the value normally comes from the URL)
export function Tabs({ label, tabs, value, onChange }) {
  const refs = useRef([]);
  const index = Math.max(0, tabs.findIndex((t) => t.value === value));
  const move = (to) => {
    const next = (to + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line overflow-x-auto mb-5">
      {tabs.map((t, i) => {
        const selected = i === index;
        return (
          <button key={t.value} ref={(el) => (refs.current[i] = el)} role="tab" type="button" aria-selected={selected}
            tabIndex={selected ? 0 : -1} onClick={() => onChange(t.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); move(i + 1); }
              if (e.key === "ArrowLeft") { e.preventDefault(); move(i - 1); }
              if (e.key === "Home") { e.preventDefault(); move(0); }
              if (e.key === "End") { e.preventDefault(); move(tabs.length - 1); }
            }}
            className={`h-11 px-3 -mb-px border-b-2 font-medium whitespace-nowrap ${selected ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
            {t.count !== undefined && <span className="ml-2 tabular-nums text-xs rounded-full px-2 py-0.5 bg-neutral-bg text-neutral-ink">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2.5 rounded-full bg-white border border-blue-border overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}
