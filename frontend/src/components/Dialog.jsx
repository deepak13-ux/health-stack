import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button, InlineError } from "./ui.jsx";

const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Modal dialog: focus trap, Escape, close button, focus returns to the trigger.
// When `dirty`, Cancel / Escape / backdrop ask "Discard your changes?" first.
// `busy` blocks closing while a save is pending.
export function Dialog({ title, description, onClose, dirty = false, busy = false, size = "md", initialFocus, footer, children }) {
  const panel = useRef(null);
  const titleId = useId();
  const descId = useId();
  const [confirming, setConfirming] = useState(false);

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  };
  const closeRef = useRef(requestClose);
  useEffect(() => { closeRef.current = requestClose; });

  useEffect(() => {
    const previous = document.activeElement;
    const el = panel.current;
    const items = () => [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.getClientRects().length);
    const first = (initialFocus && el.querySelector(initialFocus)) || items().find((n) => !n.dataset.close) || el;
    first.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) { e.preventDefault(); el.focus(); return; }
      const [a, z] = [list[0], list[list.length - 1]];
      if (e.shiftKey && (document.activeElement === a || document.activeElement === el)) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected) previous.focus();
    };
    // Mount-only: the dialog sets up focus once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const widths = { md: "sm:max-w-md", lg: "sm:max-w-[640px]", xl: "sm:max-w-3xl" };
  return (
    <div className="no-print fixed inset-0 z-50 bg-ink/40 grid sm:place-items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descId : undefined} tabIndex={-1}
        className={`cf-enter relative bg-white w-full ${widths[size]} h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[20px] flex flex-col shadow-float`}>
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-line">
          <div>
            <h2 id={titleId} className="text-lg leading-[26px] font-semibold">{title}</h2>
            {description && <p id={descId} className="text-muted">{description}</p>}
          </div>
          <button type="button" data-close="true" onClick={requestClose} aria-label="Close dialog" className="size-10 -mr-2 grid place-items-center rounded-lg hover:bg-surface-blue shrink-0">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-4 border-t border-line flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{footer({ requestClose })}</div>}
        {confirming && (
          <div role="alertdialog" aria-labelledby={`${titleId}-discard`} className="absolute inset-0 bg-white/95 sm:rounded-[20px] grid place-items-center p-6">
            <div className="text-center space-y-4 max-w-xs">
              <p id={`${titleId}-discard`} className="text-lg font-semibold">Discard your changes?</p>
              <p className="text-muted">What you entered in this form will be lost.</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>Keep editing</Button>
                <Button variant="danger" onClick={onClose}>Discard changes</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmation for a specific action. Destructive confirmations focus Cancel by default.
export function ConfirmDialog({ title, children, confirmLabel, pendingLabel, destructive, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  return (
    <Dialog title={title} onClose={onClose} busy={busy} initialFocus={destructive ? "[data-cancel]" : "[data-confirm]"}
      footer={({ requestClose }) => (
        <>
          <Button variant="secondary" data-cancel="true" onClick={requestClose} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? "danger-solid" : "primary"} data-confirm="true" pending={busy} pendingLabel={pendingLabel} onClick={run}>{confirmLabel}</Button>
        </>
      )}>
      <div className="space-y-4">
        <InlineError>{error}</InlineError>
        {children}
      </div>
    </Dialog>
  );
}
