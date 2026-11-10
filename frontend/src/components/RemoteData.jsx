import { Button, Loading } from "./ui";

export function RemoteData({ state, children }) {
  if (state.loading) return <Loading />;
  if (state.error) return <div role="alert" className="p-4 bg-[#FDEDEE] rounded-xl space-y-3"><p>{state.error}</p><Button variant="secondary" onClick={state.reload}>Retry</Button></div>;
  return children(state.data);
}
