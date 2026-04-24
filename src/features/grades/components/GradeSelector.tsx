import { memo } from "react";
import { motion } from "framer-motion";
import { GRADE_COLORS, GRADE_LETTERS } from "@/features/grades/logic";

interface GradeSelectorProps {
  value: string | null;
  onChange: (g: string | null) => void;
}

/** Horizontal tap-only grade selector: 10 9 8 7 6 5 0. */
export const GradeSelector = memo(function GradeSelector({ value, onChange }: GradeSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Pick grade"
      className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1"
    >
      {GRADE_LETTERS.map((g) => {
        const active = value === g;
        return (
          <motion.button
            key={g}
            whileTap={{ scale: 0.9 }}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : g)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: active ? GRADE_COLORS[g] : "var(--surface-2)",
              color: active ? "white" : "var(--muted-foreground)",
              boxShadow: active ? `0 0 14px ${GRADE_COLORS[g]}` : undefined,
            }}
          >
            {g}
          </motion.button>
        );
      })}
    </div>
  );
});
