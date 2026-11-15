import { useCallback, useEffect, useState } from "react";

// Loads remote data for `key`; reloads when key changes or reload() is called.
export function useRemote(loader, key = "") {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, version: -1, data: null, error: null });
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => loader())
      .then(
        (data) => active && setState({ key, version, data, error: null }),
        (error) => active && setState({ key, version, data: null, error }),
      );
    return () => {
      active = false;
    };
    // The caller supplies the resource identity as `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = state.key === key && state.version === version;
  return {
    loading: !current,
    // Keep showing the previous data while a reload is in flight.
    data: state.key === key ? state.data : null,
    error: current ? state.error : null,
    reload,
  };
}
