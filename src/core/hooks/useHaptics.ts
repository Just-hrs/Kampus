import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Haptics,
  ImpactStyle,
  NotificationType,
} from "@capacitor/haptics";

import { useStore } from "@/core/store";

type HapticPattern =
  | "tick"
  | "soft"
  | "success"
  | "warning"
  | "error"
  | "heavy";

export function useHaptics() {
  const enabled = useStore((s) => s.settings.haptics);

  return useCallback(
    async (pattern: HapticPattern = "tick") => {
      if (!enabled) return;

      if (!Capacitor.isNativePlatform()) return;

      try {
        switch (pattern) {
          case "tick":
            await Haptics.impact({
              style: ImpactStyle.Light,
            });
            break;

          case "soft":
            await Haptics.impact({
              style: ImpactStyle.Medium,
            });
            break;

          case "heavy":
            await Haptics.impact({
              style: ImpactStyle.Heavy,
            });
            break;

          case "success":
            await Haptics.notification({
              type: NotificationType.Success,
            });
            break;

          case "warning":
            await Haptics.notification({
              type: NotificationType.Warning,
            });
            break;

          case "error":
            await Haptics.notification({
              type: NotificationType.Error,
            });
            break;
        }
      } catch (err) {
        console.warn("Haptics failed:", err);
      }
    },
    [enabled],
  );
}