import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { StudySession } from "../types";

interface Props {
  sessions: StudySession[];
  weeks?: number;
}

const DAY_MS = 86_400_000;

function dayKey(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function intensity(min: number) {
  if (min <= 0) {
    return {
      bg: "bg-white/[0.04]",
      glow: "",
      scale: "scale-100",
    };
  }

  if (min < 15) {
    return {
      bg: "bg-indigo-400/40",
      glow: "shadow-[0_0_10px_rgba(129,140,248,0.35)]",
      scale: "scale-100",
    };
  }

  if (min < 40) {
    return {
      bg: "bg-violet-400/60",
      glow: "shadow-[0_0_14px_rgba(167,139,250,0.45)]",
      scale: "scale-105",
    };
  }

  if (min < 90) {
    return {
      bg: "bg-fuchsia-400/80",
      glow: "shadow-[0_0_18px_rgba(217,70,239,0.55)]",
      scale: "scale-110",
    };
  }

  return {
    bg: "bg-gradient-to-br from-orange-300 to-fuchsia-400",
    glow: "shadow-[0_0_22px_rgba(249,115,22,0.75)]",
    scale: "scale-110",
  };
}

function HeatmapBase({
  sessions,
  weeks = 14,
}: Props) {
  const grid = useMemo(() => {
    const totals = new Map<number, number>();

    for (const s of sessions) {
      const k = dayKey(s.startedAt);

      totals.set(
        k,
        (totals.get(k) ?? 0) + s.durationSec / 60,
      );
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const todayDow = today.getDay();

    const end = today.getTime();

    const start =
      end -
      (weeks * 7 - 1 + todayDow) * DAY_MS;

    const cols: {
      key: number;
      minutes: number;
    }[][] = [];

    let cur: {
      key: number;
      minutes: number;
    }[] = [];

    for (let t = start; t <= end; t += DAY_MS) {
      cur.push({
        key: t,
        minutes: totals.get(t) ?? 0,
      });

      if (cur.length === 7) {
        cols.push(cur);
        cur = [];
      }
    }

    if (cur.length) cols.push(cur);

    return cols;
  }, [sessions, weeks]);

  const totalMinutes = useMemo(() => {
    return Math.round(
      sessions.reduce(
        (a, b) => a + b.durationSec / 60,
        0,
      ),
    );
  }, [sessions]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur-xl"
    >
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_70%)]" />

      {/* orb */}
      <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      {/* top highlight */}
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-100">
                <Sparkles className="h-4 w-4" />
              </div>

              <p className="text-xs uppercase tracking-[0.22em] text-violet-200/70">
                Consistency Field
              </p>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              Every session leaves a trace.
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Your focus patterns slowly shape your future.
            </p>
          </div>

          <div className="hidden sm:block rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md">
            <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              Total Focus
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
              {totalMinutes}m
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="flex gap-[5px] min-w-max">
            {grid.map((col, i) => (
              <div
                key={i}
                className="flex flex-col gap-[5px]"
              >
                {col.map((cell) => {
                  const style = intensity(
                    cell.minutes,
                  );

                  return (
                    <motion.div
                      key={cell.key}
                      whileTap={{
                        scale: 0.9,
                      }}
                      title={`${Math.round(cell.minutes)}m`}
                      className={`
                        h-4 w-4 rounded-[5px]
                        transition-all duration-300
                        ${style.bg}
                        ${style.glow}
                        ${style.scale}
                      `}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
          <span>Low</span>

          <div className="h-3 w-3 rounded-[4px] bg-white/[0.05]" />

          <div className="h-3 w-3 rounded-[4px] bg-indigo-400/40" />

          <div className="h-3 w-3 rounded-[4px] bg-violet-400/60" />

          <div className="h-3 w-3 rounded-[4px] bg-fuchsia-400/80" />

          <div className="h-3 w-3 rounded-[4px] bg-gradient-to-br from-orange-300 to-fuchsia-400 shadow-[0_0_12px_rgba(249,115,22,0.7)]" />

          <span>Deep focus</span>
        </div>
      </div>
    </motion.section>
  );
}

export const Heatmap = memo(HeatmapBase);
