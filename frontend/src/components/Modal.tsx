'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  dismissable?: boolean;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, dismissable = true, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, dismissable]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-end justify-center bg-base-900/85 backdrop-blur-sm sm:items-center"
          onClick={() => dismissable && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={`panel relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl sm:p-8 ${
              wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
            }`}
          >
            {(title || dismissable) && (
              <div className="mb-6 flex items-start justify-between gap-4">
                {title && <h2 className="font-mono text-xl font-semibold uppercase tracking-wide text-fog">{title}</h2>}
                {dismissable && (
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="shrink-0 text-fog-faint transition-colors hover:text-fog"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
