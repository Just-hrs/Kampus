import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** ARIA label for screen readers if no visible title */
  ariaLabel?: string;
}

/**
 * Bottom sheet primitive. Renders backdrop + spring-mounted panel.
 * Caller is responsible for AnimatePresence wrapping for exit anims.
 */
export function Sheet({ open, onClose, title, children, ariaLabel }: SheetProps) {
  if (!open) return null;
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[var(--radius-3)] bg-popover p-4 shadow-[var(--shadow-lg)] border-t border-border max-h-[90svh] overflow-y-auto"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/30 mb-3" aria-hidden="true" />
        {title && (
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold">{title}</div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-full bg-muted"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </motion.div>
    </>
  );
}
