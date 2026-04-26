import { useCallback } from "react";
import { useStore } from "@/core/store";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

type HapticPattern = "tick" | "soft" | "success" | "warning" | "error" | "heavy";

export function useHaptics() {
  const enabled = useStore((s) => s.settings.haptics);

  return useCallback(async (pattern: HapticPattern = "tick") => {
    if (!enabled) return;

    try {
      // 🧠 Native path (APK / iOS)
      if (Capacitor.isNativePlatform()) {
        switch (pattern) {
          case "tick":
          case "soft":
            await Haptics.impact({ style: ImpactStyle.Light });
            break;

          case "heavy":
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;

          case "success":
            await Haptics.notification({ type: NotificationType.Success });
            break;

          case "warning":
            await Haptics.notification({ type: NotificationType.Warning });
            break;

          case "error":
            await Haptics.notification({ type: NotificationType.Error });
            break;
        }
        return;
      }

      // 🧪 Web fallback (PC browser only)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        const patterns: Record<HapticPattern, number | number[]> = {
          tick: 8,
          soft: 12,
          success: [10, 30, 10],
          warning: [20, 40, 20],
          error: [40, 30, 40],
          heavy: 30,
        };

        navigator.vibrate(patterns[pattern]);
      }
    } catch (e) {
      console.log("Haptics failed:", e);
    }
  }, [enabled]);
}