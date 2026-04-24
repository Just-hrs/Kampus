import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { THEMES } from "@/features/settings/themes";
import type { ThemeId } from "@/core/store";

interface ThemePickerProps {
  active: ThemeId;
  onPick: (id: ThemeId) => void;
}

export function ThemePicker({ active, onPick }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="App theme">
      {THEMES.map((t) => {
        const selected = active === t.id;
        return (
          <motion.button
            type="button"
            key={t.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onPick(t.id)}
            role="radio"
            aria-checked={selected}
            aria-label={`${t.name} — ${t.vibe}`}
            className="relative overflow-hidden rounded-[var(--radius-2)] p-4 text-left border-2 min-h-24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: t.preview,
              borderColor: selected ? "var(--ring)" : "transparent",
            }}
          >
            <div className="text-sm font-bold text-white">{t.name}</div>
            <div className="text-[10px] text-white/80">{t.vibe}</div>
            {selected && (
              <div
                className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black"
                aria-hidden="true"
              >
                <Check size={12} />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
