import { memo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Flame,
  Coffee,
  Zap,
  RefreshCcw,
} from "lucide-react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { STUDY_MODES } from "../data/modes";
import type { StudyModeId } from "../types";

interface Props {
  selectedId: StudyModeId;
  onSelect: (id: StudyModeId) => void;
  disabled?: boolean;
}

const ICONS = {
  "deep-focus": Brain,
  "burnout-recovery": Coffee,
  "exam-panic": Flame,
  "lazy-day": Zap,
  "revision-loop": RefreshCcw,
} as const;

function ModeSelectorBase({
  selectedId,
  onSelect,
  disabled,
}: Props) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {STUDY_MODES.map((m, index) => {
          const active = m.id === selectedId;
          const Icon = ICONS[m.id as keyof typeof ICONS];
          return (
            <motion.button
              key={m.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(m.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{
                y: -4,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className={cn(
                "group relative overflow-hidden",
                "min-w-[190px] shrink-0",
                "rounded-3xl border",
                "p-5 text-left",
                "transition-all duration-300",
                "backdrop-blur-xl",

                active
                  ? [
                      "border-violet-400/40",
                      "bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-cyan-500/10",
                      "shadow-[0_0_40px_rgba(139,92,246,0.28)]",
                    ]
                  : [
                      "border-white/10",
                      "bg-white/[0.04]",
                      "hover:border-violet-400/30",
                      "hover:bg-white/[0.07]",
                    ],

                disabled && "opacity-50",
              )}
            >
              {/* glow */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-500",
                  "bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.22),transparent_70%)]",
                  (active || !disabled) && "group-hover:opacity-100",
                )}
              />

              {/* floating accent orb */}
              <div
                className={cn(
                  "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
                  active
                    ? "bg-violet-500/30"
                    : "bg-violet-500/10",
                )}
              />

              {/* top bar */}
              <div
                className={cn(
                  "absolute inset-x-6 top-0 h-px",
                  active
                    ? "bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400"
                    : "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                )}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300",
                      active
                        ? [
                            "border-violet-300/30",
                            "bg-violet-400/15",
                            "text-violet-200",
                            "shadow-[0_0_25px_rgba(139,92,246,0.35)]",
                          ]
                        : [
                            "border-white/10",
                            "bg-white/[0.04]",
                            "text-zinc-300",
                            "group-hover:border-violet-400/20",
                            "group-hover:bg-violet-500/10",
                            "group-hover:text-violet-200",
                          ],
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="rounded-full border border-violet-300/20 bg-violet-400/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-violet-100"
                    >
                      Active
                    </motion.div>
                  )}
                </div>

                <div className="mt-5">
                  <h3
                    className={cn(
                      "text-base font-semibold tracking-tight transition-colors duration-300",
                      active
                        ? "text-white"
                        : "text-zinc-200 group-hover:text-white",
                    )}
                  >
                    {m.name}
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {m.focusMin}m focus • {m.breakMin}m recovery
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      active
                        ? "w-24 bg-gradient-to-r from-violet-400 to-cyan-300"
                        : "w-12 bg-white/10 group-hover:w-20 group-hover:bg-violet-400/40",
                    )}
                  />

                  <span className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    {active ? "Engaged" : "Ready"}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

export const ModeSelector = memo(ModeSelectorBase);

