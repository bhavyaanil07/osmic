// Small pop-up messages ("Task created", "Wrong code"...) in the corner.
import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, CircleX, Mail, X } from 'lucide-react';

const ToastContext = createContext(() => {});

const ICONS = { success: CircleCheck, error: CircleX, email: Mail };
const TONE = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  email: 'text-brand-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((text, kind = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.kind] || CircleCheck;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto relative overflow-hidden rounded-xl border border-slate-200 bg-panel p-3.5 pr-10 shadow-lift"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${TONE[t.kind]}`} aria-hidden="true" />
                  <p className="text-sm text-slate-800">{t.text}</p>
                </div>
                <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="absolute right-2 top-2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
                <motion.div className="absolute bottom-0 left-0 h-0.5 bg-brand-500/60" initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 4.2, ease: 'linear' }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
