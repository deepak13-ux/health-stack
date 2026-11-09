import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSnapshot } from "./api/admin";

export function useAsync(fn, deps = []) {
  const [s, setS] = useState({ data: null, error: "" });
  const run = useCallback(() => {
    fn()
      .then((data) => setS({ data, error: "" }))
      .catch((e) => setS((x) => ({ ...x, error: e.message })));
  }, deps); // eslint-disable-line
  useEffect(() => {
    run();
  }, [run]);
  return { ...s, reload: run };
}
export const useSnapshot = () => useAsync(getSnapshot, []);

// Filters/tab/page live in the URL so browser Back restores them.
export function useQ(defaults) {
  const [sp, setSp] = useSearchParams();
  const get = (k) => sp.get(k) ?? defaults[k];
  const set = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null || v === defaults[k]) n.delete(k);
      else n.set(k, v);
    });
    if (!("page" in patch)) n.delete("page");
    setSp(n);
  };
  return [get, set];
}
