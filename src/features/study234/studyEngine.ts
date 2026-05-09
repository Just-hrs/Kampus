import { create } from "zustand";
import type { StudyMode } from "./types";

export type StudyState =
  | "idle"
  | "entry"
  | "focus"
  | "deep_flow"
  | "recovery";

interface StudyEngineState {
  state: StudyState;

  mode: StudyMode | null;

  sessionStartAt: number | null;
  sessionElapsedSec: number;

  fatigueScore: number; // 0–100 (internal signal, not UI)

  // actions
  enter: (mode: StudyMode) => void;
  startEntry: () => void;
  startFocus: () => void;
  startRecovery: () => void;
  tick: () => void;
  reset: () => void;
  endSession: () => void;
}

function now() {
  return Date.now();
}

function calcFatigue(elapsedSec: number) {
  // simple nonlinear fatigue curve
  if (elapsedSec < 300) return 10;
  if (elapsedSec < 900) return 25;
  if (elapsedSec < 1500) return 45;
  if (elapsedSec < 2700) return 70;
  return 90;
}

export const useStudyEngine = create<StudyEngineState>((set, get) => ({
  state: "idle",
  mode: null,

  sessionStartAt: null,
  sessionElapsedSec: 0,

  fatigueScore: 0,

  enter: (mode) => {
    set({
      mode,
      state: "entry",
      sessionStartAt: null,
      sessionElapsedSec: 0,
      fatigueScore: 0,
    });
  },

  startEntry: () => {
    set({
      state: "entry",
      sessionStartAt: now(),
      sessionElapsedSec: 0,
    });
  },

  startFocus: () => {
    set({
      state: "focus",
      sessionStartAt: now(),
      sessionElapsedSec: 0,
    });
  },

  startRecovery: () => {
    set({
      state: "recovery",
      sessionStartAt: now(),
      sessionElapsedSec: 0,
    });
  },

  tick: () => {
    const { sessionStartAt, state } = get();
    if (!sessionStartAt) return;

    const elapsedSec = Math.floor((now() - sessionStartAt) / 1000);
    const fatigue = calcFatigue(elapsedSec);

    let nextState = state;

    // AUTO TRANSITIONS (this is the core intelligence)

    if (state === "entry" && elapsedSec >= 180) {
      nextState = "focus";
    }

    if (state === "focus") {
      if (elapsedSec >= 900 && fatigue >= 45) {
        nextState = "deep_flow";
      }

      if (fatigue >= 85) {
        nextState = "recovery";
      }
    }

    if (state === "deep_flow" && fatigue >= 80) {
      nextState = "recovery";
    }

    if (state === "recovery" && elapsedSec >= 600) {
      nextState = "idle";
    }

    set({
      sessionElapsedSec: elapsedSec,
      fatigueScore: fatigue,
      state: nextState,
    });
  },

  endSession: () => {
    set({
      state: "recovery",
      sessionStartAt: now(),
      sessionElapsedSec: 0,
    });
  },

  reset: () => {
    set({
      state: "idle",
      mode: null,
      sessionStartAt: null,
      sessionElapsedSec: 0,
      fatigueScore: 0,
    });
  },
}));