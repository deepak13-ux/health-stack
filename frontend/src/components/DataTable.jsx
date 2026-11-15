import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState } from "../hooks/useQueryState.js";
import { Button } from "./ui.jsx";

const SIZES = [10, 25, 50];

// Sortable, paginated table. Sort/page/size live in the URL. Below 768px rows render as
// cards when `renderCard` is given. columns: { key, header, render, sortValue?, align? }.
export function DataTable({ caption, columns, rows, rowKey = (r) => r.id, defaultSort, defaultDir = "asc", renderCard, empty }) {
  const [q, setQ] = useQueryState({ sort: defaultSort, dir: defaultDir, page: "1", size: "10" });
  const column = columns.find((c) => c.key === q.sort && c.sortValue) || columns.find((c) => c.key === defaultSort);
  const dir = q.dir === "desc" ? -1 : 1;
  const sorted = column?.sortValue
    ? [...rows].sort((a, b) => {
        const x = column.sortValue(a), y = column.sortValue(b);
        return (x < y ? -1 : x > y ? 1 : 0) * dir;
      })
    : rows;
  const size = SIZES.includes(Number(q.size)) ? Number(q.size) : 10;
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const page = Math.min(Math.max(1, Number(q.page) || 1), pages);
  const shown = sorted.slice((page - 1) * size, page * size);

  if (!rows.length) return empty;

  const toggle = (c) => {
    const nextDir = q.sort === c.key ? (q.dir === "asc" ? "desc" : "asc") : "asc";
    setQ({ sort: c.key, dir: nextDir });
  };

  return (
    <div>
      {renderCard && <ul className="md:hidden space-y-3 p-4" aria-label={caption}>{shown.map((r) => <li key={rowKey(r)}>{renderCard(r)}</li>)}</ul>}
      <div className={`${renderCard ? "hidden md:block" : ""} overflow-x-auto`} role="region" aria-label={caption} tabIndex={0}>
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => {
                const active = column?.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (dir === 1 ? "ascending" : "descending") : c.sortValue ? "none" : undefined}
                    className={`px-5 py-3 text-xs leading-[18px] font-semibold text-muted whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}>
                    {c.sortValue ? (
                      <button type="button" onClick={() => toggle(c)} className="inline-flex items-center gap-1 hover:text-ink -mx-1 px-1 rounded">
                        {c.header}
                        {active && (dir === 1 ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={rowKey(r)} className="border-b border-line last:border-0 hover:bg-row-hover">
                {columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3 align-middle ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{c.render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > 10 && (
        <nav aria-label={`${caption} pages`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-line">
          <label className="flex items-center gap-2 text-muted">
            Rows per page
            <select value={size} onChange={(e) => setQ({ size: e.target.value })} className="h-9 px-2 rounded-[10px] border border-control bg-white text-ink">
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className="tabular-nums text-muted" aria-live="polite">{(page - 1) * size + 1}–{Math.min(page * size, sorted.length)} of {sorted.length}</span>
            <Button size="sm" variant="secondary" aria-label="Previous page" disabled={page <= 1} onClick={() => setQ({ page: page - 1 }, { resetPage: false })}><ChevronLeft size={16} aria-hidden="true" /></Button>
            <Button size="sm" variant="secondary" aria-label="Next page" disabled={page >= pages} onClick={() => setQ({ page: page + 1 }, { resetPage: false })}><ChevronRight size={16} aria-hidden="true" /></Button>
          </div>
        </nav>
      )}
    </div>
  );
}
