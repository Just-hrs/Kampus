import { useCallback } from "react";
import { useStore } from "@/core/store";
import { sounds } from "./soundMap";

type SoundType = keyof typeof sounds;

// export function useSounds() {
//   const enabled = useStore((s) => 
//     s.settings.sound);

//   return useCallback((type: SoundType) => {
//     if (!enabled) return;

//     try {
//       const audio = new Audio(sounds[type]);
//       audio.volume = 0.4;
//       audio.play();
//     } catch (e) {
//       console.log("Sound failed:", e);
//     }
//   }, [enabled]);
// }

