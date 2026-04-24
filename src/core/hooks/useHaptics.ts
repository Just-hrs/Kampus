import { useCallback } from "react";
import { useStore } from "@/core/store";

type HapticPattern = "tick" | "soft" | "success" | "warning" | "error" | "heavy";

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tick: 8,
  soft: 12,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [40, 30, 40],
  heavy: 30,
};

export function useHaptics() {
  const enabled = useStore((s) => s.settings.haptics);
  return useCallback(
    (pattern: HapticPattern = "tick") => {
      if (!enabled) return;
      if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // ignore
      }
    },
    [enabled],
  );
}
