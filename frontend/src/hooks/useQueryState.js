import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

// List state (search, filters, tab, sort, page) lives in the URL so Back restores it.
export function useQueryState(defaults) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(
    Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d]),
  );
  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v === undefined || v === null || v === "" || String(v) === String(defaults[k])) next.delete(k);
          else next.set(k, String(v));
        }
        if (resetPage && !("page" in changes)) next.delete("page");
        return next;
      }, { replace: true });
    },
    // defaults is a literal at each call site; its values never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  );
  return [values, update];
}
