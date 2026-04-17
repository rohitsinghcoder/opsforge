import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastContext, type ToastType } from './toastContextDef';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<number, number>>(new Map());

  const removeToast = useCallback((id: number) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timeoutId = window.setTimeout(() => {
      removeToast(id);
    }, 3500);
    timeoutIdsRef.current.set(id, timeoutId);
  }, [removeToast]);

  useEffect(() => () => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
  }, []);

  const iconMap = {
    success: <CheckCircle size={14} className="text-accent shrink-0" />,
    error: <AlertTriangle size={14} className="text-red-400 shrink-0" />,
    info: <Info size={14} className="text-zinc-400 shrink-0" />,
  };

  const borderMap = {
    success: 'border-accent/30',
    error: 'border-red-500/30',
    info: 'border-white/10',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[600] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-black/90 backdrop-blur-xl border ${borderMap[toast.type]} rounded-xl font-mono text-xs text-zinc-200 shadow-lg max-w-xs`}
            >
              {iconMap[toast.type]}
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-600 hover:text-white transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
