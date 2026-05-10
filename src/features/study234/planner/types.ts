export type StudyBlockType = "morning" | "afternoon" | "evening" | "night";

export type PlannedModeHint =
  | "firestart_loop"
  | "deep_run"
  | "tab_chaos"
  | "soft_reset"
  | "auto_pilot"
  | "any";

export interface DayPlan {
  date: string;
  driftScore: number;

  plannedTotal: number;
  actualTotal: number;

  blocks: StudyBlock[];
}

export interface StudyBlock {
  id: string;
  day: string;
  type: StudyBlockType;

  plannedMin: number;
  actualMin?: number;

  modeHint: PlannedModeHint;

  label?: string;
  completed?: boolean;
}