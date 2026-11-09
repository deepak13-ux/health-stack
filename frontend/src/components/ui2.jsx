import { useState } from "react";
import { Button, Card, Empty, Field, Input, Loading, Modal, Table } from "./ui";

export const Err = ({ msg }) =>
  msg ? (
    <p role="alert" className="bg-[#FDEDEE] text-[#A12B35] rounded-lg p-3 mb-4">
      {msg}
    </p>
  ) : null;

export const Tabs = ({ tabs, value, onChange }) => (
  <div
    role="tablist"
    className="flex gap-6 border-b border-line mb-5 overflow-x-auto"
  >
    {tabs.map(([k, label]) => (
      <button
        key={k}
        role="tab"
        aria-selected={value === k}
        onClick={() => onChange(k)}
        className={`h-11 whitespace-nowrap font-medium border-b-2 -mb-px ${value === k ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink"}`}
      >
        {label}
      </button>
    ))}
  </div>
);

export function Gate({ s, children }) {
  if (s.error)
    return (
      <Card>
        <Empty title="We couldn’t load this.">
          {s.error}
          <div className="mt-3">
            <Button onClick={s.reload}>Retry</Button>
          </div>
        </Empty>
      </Card>
    );
  if (!s.data) return <Loading />;
  return children(s.data);
}

export function useToast() {
  const [m, setM] = useState("");
  const show = (t) => {
    setM(t);
    setTimeout(() => setM(""), 3500);
  };
  const node = m ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] bg-ink text-white rounded-xl px-4 py-3 shadow-[0_8px_24px_rgba(23,50,77,0.12)]"
    >
      {m}
    </div>
  ) : null;
  return [node, show];
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  danger,
  requireText,
  busy,
  onConfirm,
  onCancel,
}) {
  const [t, setT] = useState("");
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="text-muted mb-4">{children}</div>
      {requireText && (
        <Field label={`Type ${requireText} to confirm`}>
          <Input value={t} onChange={(e) => setT(e.target.value)} />
        </Field>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <Button autoFocus variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          loading={busy}
          disabled={requireText && t !== requireText}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export const paginate = (rows, page = 1, size = 10) => {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), pages);
  return {
    pages,
    page: p,
    rows: rows.slice((p - 1) * size, p * size),
    from: rows.length ? (p - 1) * size + 1 : 0,
    to: Math.min(p * size, rows.length),
    total: rows.length,
  };
};
export const Pager = ({ pg, onPage }) =>
  pg.total === 0 ? null : (
    <div className="flex items-center justify-between pt-4 text-muted">
      <span className="tabular-nums">
        {pg.from}–{pg.to} of {pg.total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={pg.page <= 1}
          onClick={() => onPage(pg.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={pg.page >= pg.pages}
          onClick={() => onPage(pg.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

export function BarChart({ data, fmt = (v) => v, highlight, caption }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div
        className="flex items-end gap-2 h-40"
        role="img"
        aria-label={caption}
      >
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${fmt(d.value)}`}
            className="flex-1 min-w-0 h-full flex flex-col items-center justify-end"
          >
            <span className="text-[11px] tabular-nums mb-1">
              {d.value ? fmt(d.value) : ""}
            </span>
            <div
              className={`w-full rounded-t-md ${d.label === highlight ? "bg-lime" : "bg-primary"}`}
              style={{
                height: `${(d.value / max) * 100}%`,
                minHeight: d.value ? 4 : 2,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-1 text-[11px] text-muted">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center truncate">
            {d.label.slice(5)}
          </span>
        ))}
      </div>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-primary">View as table</summary>
        <Table caption={caption} heads={["Date", "Value"]}>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td className="tabular-nums">{fmt(d.value)}</td>
            </tr>
          ))}
        </Table>
      </details>
    </div>
  );
}
