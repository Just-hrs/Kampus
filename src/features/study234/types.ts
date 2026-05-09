export type StudyModeId =
  | "deep-focus"
  | "burnout-recovery"
  | "exam-panic"
  | "lazy-day"
  | "revision-loop"
  | "quick-start";

export interface StudyMode {
  id: StudyModeId;
  name: string;
  tagline: string;
  focusMin: number;
  breakMin: number;
  accent: string; // tailwind text/gradient class fragment
}

export type Mood = "great" | "ok" | "tired" | "anxious";

export interface StudySession {
  id: string;
  modeId: StudyModeId;
  startedAt: number;
  durationSec: number; // actual focused time
  completed: boolean;
  mood?: Mood;
}

export type TimerPhase = "focus" | "break" | "idle";
