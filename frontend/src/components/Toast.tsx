'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, CircleAlert, Info, Loader2, X, ExternalLink } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { explorerTx } from '@/lib/contract';
import { shortHash } from '@/lib/format';

type ToastKind = 'loading' | 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  hash?: string;
}

interface ToastApi {
  push: (t: Omit<Toast, 'id'>) => number;
  update: (id: number, t: Partial<Omit<Toast, 'id'>>) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const ICON: Record<ToastKind, React.ReactNode> = {
  loading: <Loader2 className="h-4 w-4 animate-spin-slow text-amber" />,
  success: <Check className="h-4 w-4 text-signal-thrive" />,
  error: <CircleAlert className="h-4 w-4 text-signal-peril" />,
  info: <Info className="h-4 w-4 text-fog-muted" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const scheduleAuto = useCallback(
    (id: number, kind: ToastKind) => {
      if (timers.current[id]) clearTimeout(timers.current[id]);
      if (kind === 'success' || kind === 'info') {
        timers.current[id] = setTimeout(() => dismiss(id), 8000);
      }
    },
    [dismiss],
  );

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = ++seq.current;
      setToasts((list) => [...list, { ...t, id }]);
      scheduleAuto(id, t.kind);
      return id;
    },
    [scheduleAuto],
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, 'id'>>) => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.kind) scheduleAuto(id, patch.kind);
    },
    [scheduleAuto],
  );

  const api = useMemo(() => ({ push, update, dismiss }), [push, update, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="panel pointer-events-auto rounded-lg p-4 shadow-panel"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">{ICON[t.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-fog">{t.message}</p>
                  {t.hash && (
                    <a
                      href={explorerTx(t.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs text-amber hover:text-amber-bright"
                    >
                      {shortHash(t.hash)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 text-fog-faint transition-colors hover:text-fog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
