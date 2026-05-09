import { create } from "zustand";

export type StudyState = "idle" | "focus" | "break";

export interface StudyCore {
  state: StudyState;

  sessionStart: number | null;
  elapsedSec: number;

  sessions: number;
  streak: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useStudyCore = create<StudyCore>((set, get) => ({
  state: "idle",

  sessionStart: null,
  elapsedSec: 0,

  sessions: 0,
  streak: 0,

  start: () => {
    set({
      state: "focus",
      sessionStart: Date.now(),
      elapsedSec: 0,
    });
  },

  pause: () => set({ state: "break" }),

  reset: () =>
    set({
      state: "idle",
      sessionStart: null,
      elapsedSec: 0,
    }),

  tick: () => {
    const s = get();
    if (!s.sessionStart || s.state !== "focus") return;

    const elapsed = Math.floor((Date.now() - s.sessionStart) / 1000);

    set({ elapsedSec: elapsed });
  },
}));