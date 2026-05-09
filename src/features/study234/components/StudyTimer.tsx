import { memo, useMemo } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

import {
  Pause,
  Play,
  RotateCcw,
  Zap,
  Coffee,
} from "lucide-react";

import type {
  StudyMode,
  TimerPhase,
} from "../types";

interface Props {
  mode: StudyMode;
  phase: TimerPhase;
  running: boolean;
  remaining: number;
  totalSec: number;
  progress: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdjust: (sec: number) => void;
}

const SIZE = 290;
const STROKE = 14;

const R = (SIZE - STROKE) / 2;

const C = 2 * Math.PI * R;

function format(sec: number) {
  const m = Math.floor(sec / 60);

  const s = sec % 60;

  return `${m
    .toString()
    .padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function StudyTimerBase({
  mode,
  phase,
  running,
  remaining,
  totalSec,
  progress,
  onStart,
  onPause,
  onReset,
  onAdjust,
}: Props) {
  const dash = useMemo(
    () => C * (1 - progress),
    [progress],
  );

  const isFocus = phase === "focus";

  const isBreak = phase === "break";

  const idle = phase === "idle";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* TIMER */}
      <motion.div
        animate={
          running
            ? {
                scale: [1, 1.015, 1],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
        className="relative"
      >
        {/* outer glow */}
        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl dark:block hidden" />

        {/* glass ring */}
        <div className="relative flex items-center justify-center rounded-full border border-border/50 bg-card/70 p-5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]">
          <svg
            width={SIZE}
            height={SIZE}
            className="-rotate-90"
          >
            <defs>
              <linearGradient
                id="timer-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8b5cf6"
                />

                <stop
                  offset="100%"
                  stopColor="#06b6d4"
                />
              </linearGradient>
            </defs>

            {/* background ring */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke="currentColor"
              className="text-border/30"
              strokeWidth={STROKE}
              fill="none"
            />

            {/* animated ring */}
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke="url(#timer-gradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              animate={{
                strokeDashoffset: dash,
              }}
              transition={{
                duration: 0.6,
              }}
            />
          </svg>

          {/* CENTER */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={
                running
                  ? {
                      opacity: [0.7, 1, 0.7],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="mb-3 flex items-center gap-2 rounded-full border border-border/50 bg-background/70 px-4 py-1.5 backdrop-blur-md"
            >
              {isFocus ? (
                <Zap className="h-3.5 w-3.5 text-violet-500" />
              ) : (
                <Coffee className="h-3.5 w-3.5 text-cyan-500" />
              )}

              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {idle
                  ? "READY"
                  : isFocus
                    ? "FOCUS"
                    : "BREAK"}
              </span>
            </motion.div>

            <motion.div
              key={remaining}
              initial={{
                scale: 0.96,
                opacity: 0.7,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="font-mono text-6xl font-light tracking-tight text-foreground tabular-nums"
            >
              {format(remaining)}
            </motion.div>

            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {mode.name}
            </p>
          </div>
        </div>
      </motion.div>

      {/* CONTROLS */}
      <div className="flex items-center gap-4">
        {running ? (
          <motion.div
            whileTap={{ scale: 0.94 }}
          >
            <Button
              size="lg"
              variant="secondary"
              onClick={onPause}
              className="h-14 rounded-2xl px-7 text-base shadow-lg"
            >
              <Pause className="mr-2 h-5 w-5" />

              Pause
            </Button>
          </motion.div>
        ) : (
          <motion.div
            whileTap={{ scale: 0.94 }}
          >
            <Button
              size="lg"
              onClick={onStart}
              className="h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 text-base font-semibold shadow-xl"
            >
              <Play className="mr-2 h-5 w-5" />

              {idle
                ? "Start Focus"
                : "Resume"}
            </Button>
          </motion.div>
        )}

        <motion.div
          whileTap={{ scale: 0.92 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={onReset}
            className="h-14 w-14 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* SLIDER */}
      {idle && (
        <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Focus Duration
              </p>

              <p className="text-xs text-muted-foreground">
                Customize your session
              </p>
            </div>

            <div className="rounded-xl bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              {Math.round(
                totalSec / 60,
              )}m
            </div>
          </div>

          <Slider
            value={[
              Math.round(
                totalSec / 60,
              ),
            ]}
            min={5}
            max={90}
            step={5}
            onValueChange={(v) =>
              onAdjust(v[0] * 60)
            }
          />
        </div>
      )}
    </div>
  );
}

export const StudyTimer =
  memo(StudyTimerBase);
