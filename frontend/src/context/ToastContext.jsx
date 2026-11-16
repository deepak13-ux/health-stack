import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const toast = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((all) => [...all.slice(-2), { id, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div aria-live="polite" role="status" className="no-print fixed z-[60] bottom-4 right-4 left-4 sm:left-auto flex flex-col gap-2 items-stretch sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} className="cf-enter flex items-center gap-3 bg-ink text-white rounded-[10px] pl-4 pr-2 py-2 shadow-float sm:min-w-72">
            <CheckCircle2 size={18} aria-hidden="true" className="text-lime shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="size-9 grid place-items-center rounded-lg hover:bg-white/10">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
