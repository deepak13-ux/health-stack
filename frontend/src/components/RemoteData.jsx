import { ErrorState, Skeleton } from "./ui.jsx";

// Loading skeleton → error with Retry → content. Previous data stays visible during reloads.
export function RemoteData({ state, rows = 4, children, label }) {
  if (state.data == null && state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  if (state.data == null) return <Skeleton rows={rows} label={label} />;
  return (
    <>
      {state.error && <div className="mb-4"><ErrorState title="We couldn't refresh this." error={state.error} onRetry={state.reload} /></div>}
      {children(state.data)}
    </>
  );
}
