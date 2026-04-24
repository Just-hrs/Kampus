import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useHaptics } from "@/core/hooks/useHaptics";

interface BootSequenceProps {
  lines: readonly string[];
  /** Boot label shown at top, e.g. "BUNK_OS · v3.14" */
  label?: string;
  /** Centered emoji shown above the label. If omitted, no emoji. */
  emoji?: string;
  /** Total visible duration before triggering onDone. */
  duration?: number;
  /** Time per line in ms */
  linePace?: number;
  onDone: () => void;
}

/**
 * Generic terminal-style boot sequence used by Bunk Simulator and Game Center.
 * Respects prefers-reduced-motion via CSS animation overrides.
 */
export function BootSequence({
  lines,
  label,
  emoji,
  duration = 2600,
  linePace = 320,
  onDone,
}: BootSequenceProps) {
  const [lineIdx, setLineIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const haptic = useHaptics();

  useEffect(() => {
    haptic("heavy");
    const lineTimer = setInterval(() => {
      setLineIdx((i) => {
        if (i + 1 >= lines.length) {
          clearInterval(lineTimer);
          return i;
        }
        haptic("tick");
        return i + 1;
      });
    }, linePace);

    const startProg = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - startProg) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        haptic("success");
        setTimeout(onDone, 250);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      clearInterval(lineTimer);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black scanlines"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md px-6 font-mono">
        {emoji && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-6 text-center"
            aria-hidden="true"
          >
            {emoji}
          </motion.div>
        )}
        {label && (
          <div className="mb-6 text-xs uppercase tracking-[0.3em] text-primary text-neon text-center">
            {label}
          </div>
        )}
        <div className="space-y-1.5 text-sm text-primary text-neon min-h-48">
          {lines.slice(0, lineIdx + 1).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-2"
            >
              <span className="text-accent">▸</span>
              <span>{line}</span>
              {i === lineIdx && i < lines.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-accent"
                >
                  _
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-8">
          <div className="h-2 overflow-hidden rounded-full border border-primary/30 bg-primary/10">
            <div
              className="h-full transition-[width] duration-100"
              style={{
                width: `${progress * 100}%`,
                background: "var(--grad-primary)",
                boxShadow: "var(--glow-primary)",
              }}
            />
          </div>
          <div className="mt-2 text-right font-mono text-[10px] text-primary">
            {Math.floor(progress * 100)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}
