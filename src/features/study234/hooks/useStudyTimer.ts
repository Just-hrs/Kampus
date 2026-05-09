import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyMode, TimerPhase } from "../types";
import { useStudyOnboarding } from "../onboarding/studyOnboarding";

interface UseStudyTimerOpts {
  mode: StudyMode;
  onFocusComplete?: (focusedSec: number) => void;
}

export function useStudyTimer({ mode, onFocusComplete }: UseStudyTimerOpts) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [running, setRunning] = useState(false);
  const [totalSec, setTotalSec] = useState(mode.focusMin * 60);
  const [remaining, setRemaining] = useState(mode.focusMin * 60);
  const intervalRef = useRef<number | null>(null);
  const focusedRef = useRef(0);

  // Reset on mode change (only if idle)
  useEffect(() => {
    if (phase === "idle") {
      setTotalSec(mode.focusMin * 60);
      setRemaining(mode.focusMin * 60);
    }
  }, [mode.id, mode.focusMin, phase]);

  const clear = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => () => clear(), []);

  useEffect(() => {
    if (!running) {
      clear();
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear();
          setRunning(false);
          if (phase === "focus") {
            const focused = focusedRef.current + 1;
            focusedRef.current = 0;
            onFocusComplete?.(focused);
            // switch to break
            const breakSec = mode.breakMin * 60;
            setPhase("break");
            setTotalSec(breakSec);
            return breakSec;
          } else {
            // break done -> idle
            setPhase("idle");
            const focusSec = mode.focusMin * 60;
            setTotalSec(focusSec);
            return focusSec;
          }
        }
        if (phase === "focus") focusedRef.current += 1;
        return r - 1;
      });
    }, 1000);
    return clear;
  }, [running, phase, mode.focusMin, mode.breakMin, onFocusComplete]);

  const start = useCallback(() => {
    //onboarding.nextStep();
    const onboarding = useStudyOnboarding.getState();
    if (phase === "idle") {
      setPhase("focus");
      const t = mode.focusMin * 60;
      setTotalSec(t);
      setRemaining(t);
      focusedRef.current = 0;
    }
    setRunning(true);
  }, [phase, mode.focusMin]);

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    clear();
    setRunning(false);
    setPhase("idle");
    focusedRef.current = 0;
    const t = mode.focusMin * 60;
    setTotalSec(t);
    setRemaining(t);
  }, [mode.focusMin]);

  const adjust = useCallback(
    (sec: number) => {
      if (phase !== "idle") return;
      const clamped = Math.max(60, Math.min(120 * 60, sec));
      setTotalSec(clamped);
      setRemaining(clamped);
    },
    [phase],
  );

  const progress = totalSec > 0 ? 1 - remaining / totalSec : 0;

  return { phase, running, remaining, totalSec, progress, start, pause, reset, adjust };
}
