import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { StudySession } from "../types";

interface Props {
  sessions: StudySession[];
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
      bg: "bg-muted/30",
      glow: "",
      scale: "scale-100",
    };
  }

  if (min < 15) {
    return {
      bg: "bg-primary/30",
      glow: "",
      scale: "scale-100",
    };
  }

  if (min < 40) {
    return {
      bg: "bg-primary/50",
      glow:
        "shadow-[0_0_10px_hsl(var(--primary)/0.25)]",
      scale: "scale-[1.03]",
    };
  }

  if (min < 90) {
    return {
      bg: "bg-primary/70",
      glow:
        "shadow-[0_0_16px_hsl(var(--primary)/0.35)]",
      scale: "scale-[1.05]",
    };
  }

  return {
    bg: "bg-primary",
    glow:
      "shadow-[0_0_24px_hsl(var(--primary)/0.55)]",
    scale: "scale-[1.08]",
  };
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function HeatmapBase({ sessions }: Props) {
  const [offset, setOffset] = useState(0);

  const {
    cols,
    totalMinutes,
    monthText,
  } = useMemo(() => {
    const totals = new Map<number, number>();

    for (const s of sessions) {
      const k = dayKey(s.startedAt);

      totals.set(
        k,
        (totals.get(k) ?? 0) +
          s.durationSec / 60,
      );
    }

    const base = new Date();

    base.setMonth(base.getMonth() + offset);

    const year = base.getFullYear();
    const month = base.getMonth();

    const first = new Date(year, month, 1);

    const last = new Date(year, month + 1, 0);

    const start = new Date(first);

    start.setDate(
      start.getDate() - start.getDay(),
    );

    const end = new Date(last);

    end.setDate(
      end.getDate() + (6 - end.getDay()),
    );

    const cells: {
      key: number;
      minutes: number;
      future: boolean;
    }[] = [];

    const today = dayKey(Date.now());

    for (
      let t = start.getTime();
      t <= end.getTime();
      t += DAY_MS
    ) {
      cells.push({
        key: t,
        minutes: totals.get(t) ?? 0,
        future: t > today,
      });
    }

    const rows = 4;

    const perRow = Math.ceil(
      cells.length / rows,
    );

    const columns: typeof cells[] = [];

    for (let i = 0; i < rows; i++) {
      columns.push(
        cells.slice(
          i * perRow,
          (i + 1) * perRow,
        ),
      );
    }

    return {
      cols: columns,
      totalMinutes: Math.round(
        sessions.reduce(
          (a, b) =>
            a + b.durationSec / 60,
          0,
        ),
      ),
      monthText: monthLabel(base),
    };
  }, [sessions, offset]);

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        relative overflow-hidden
        rounded-[2rem]
        border border-border/50
        bg-card/60
        p-5
        shadow-xl
        backdrop-blur-xl
      "
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_70%)]" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-xl
                  border border-primary/20
                  bg-primary/10
                  text-primary
                "
              >
                <Sparkles className="h-4 w-4" />
              </div>

              <p
                className="
                  text-xs uppercase
                  tracking-[0.22em]
                  text-primary/70
                "
              >
                Consistency Field
              </p>
            </div>

            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Every session leaves a trace.
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your focus patterns slowly shape your future.
            </p>
          </div>

          <div
            className="
              hidden sm:block
              rounded-2xl
              border border-border/50
              bg-background/40
              px-4 py-3
            "
          >
            <p
              className="
                text-[11px]
                uppercase
                tracking-[0.16em]
                text-muted-foreground
              "
            >
              Total Focus
            </p>

            <p className="mt-1 text-2xl font-semibold text-foreground">
              {totalMinutes}m
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() =>
              setOffset((v) => v - 1)
            }
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl
              border border-border/50
              bg-background/40
              transition-colors
              hover:bg-primary/10
            "
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <p className="text-sm font-semibold tracking-wide text-foreground">
            {monthText}
          </p>

          <button
            onClick={() =>
              setOffset((v) => v + 1)
            }
            className="
              flex h-9 w-9 items-center justify-center
              rounded-xl
              border border-border/50
              bg-background/40
              transition-colors
              hover:bg-primary/10
            "
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="flex flex-col gap-[5px]">
              {cols.map((col, i) => (
              <div
                key={i}
                className="flex gap-[5px]"
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
                      title={`${Math.round(
                        cell.minutes,
                      )}m`}
                      className={`
                        h-4 w-4 rounded-[5px]
                        transition-all duration-200
                        ${
                          cell.future
                            ? "border border-dashed border-border/60 bg-muted/20 opacity-40"
                            : style.bg
                        }
                        ${
                          !cell.future
                            ? style.glow
                            : ""
                        }
                        ${
                          !cell.future
                            ? style.scale
                            : ""
                        }
                      `}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div
          className="
            mt-6 flex flex-wrap items-center gap-3
            text-[11px]
            text-muted-foreground
          "
        >
          <span>Low</span>

          <div className="h-3 w-3 rounded-[4px] bg-muted/30" />

          <div className="h-3 w-3 rounded-[4px] bg-primary/30" />

          <div className="h-3 w-3 rounded-[4px] bg-primary/50" />

          <div className="h-3 w-3 rounded-[4px] bg-primary/70" />

          <div className="h-3 w-3 rounded-[4px] bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.55)]" />

          <span>Deep focus</span>
        </div>
      </div>
    </motion.section>
  );
}

export const Heatmap = memo(HeatmapBase);