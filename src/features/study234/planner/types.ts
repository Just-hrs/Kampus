export type StudyBlockType = "morning" | "afternoon" | "evening" | "night";

export type PlannedModeHint =
  | "firestart_loop"
  | "deep_run"
  | "tab_chaos"
  | "soft_reset"
  | "auto_pilot"
  | "any";

export interface StudyBlock {
  id: string;

  day: string; // ISO date (2026-01-24)
  type: StudyBlockType;

  plannedMin: number;
  actualMin?: number;

  modeHint: PlannedModeHint;

  label?: string; // optional user text like "Physics grind"
  completed?: boolean;
}
export interface DayPlan {
  plannedTotal: number; // minutes planned for the day

  blocks?: {
    modeHint: string;
    durationMin: number;
  }[];
}