import { useEffect, useState } from "react";

export function useRemote(loader, key = "") {
  const [state, setState] = useState({
    key,
    version: 0,
    data: null,
    error: "",
    loading: true,
  });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return;
        setState({ key, version, data: null, error: "", loading: true });
        return loader();
      })
      .then((data) => {
        if (active) setState({ key, version, data, error: "", loading: false });
      })
      .catch((e) => {
        if (active)
          setState({
            key,
            version,
            data: null,
            error: e.message,
            loading: false,
          });
      });
    return () => {
      active = false;
    };
    // Callers supply the resource identity as key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);
  return {
    ...state,
    loading: state.loading || state.key !== key || state.version !== version,
    reload: () => setVersion((v) => v + 1),
  };
}
