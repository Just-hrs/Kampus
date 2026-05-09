import type { StudyMode } from "../types";

export const STUDY_MODES: StudyMode[] = [
  {
    id: "deep-focus",
    name: "Deep Focus",
    tagline: "Long, uninterrupted study block",
    focusMin: 50,
    breakMin: 10,
    accent: "from-indigo-500 to-violet-500",
  },
  {
    id: "burnout-recovery",
    name: "Burnout Recovery",
    tagline: "Gentle re-entry, low pressure",
    focusMin: 15,
    breakMin: 5,
    accent: "from-cyan-500 to-sky-500",
  },
  {
    id: "exam-panic",
    name: "Exam Panic",
    tagline: "High-intensity cramming",
    focusMin: 40,
    breakMin: 5,
    accent: "from-rose-500 to-orange-500",
  },
  {
    id: "lazy-day",
    name: "Lazy Day",
    tagline: "Minimum viable studying",
    focusMin: 10,
    breakMin: 3,
    accent: "from-emerald-500 to-teal-500",
  },
  {
    id: "revision-loop",
    name: "Revision Loop",
    tagline: "Classic pomodoro for review",
    focusMin: 25,
    breakMin: 5,
    accent: "from-violet-500 to-fuchsia-500",
  },
];

export const QUICK_START_MODE: StudyMode = {
  id: "quick-start",
  name: "Just Start",
  tagline: "5 low-pressure minutes",
  focusMin: 5,
  breakMin: 2,
  accent: "from-cyan-400 to-indigo-400",
};

export function getMode(id: string): StudyMode {
  if (id === "quick-start") return QUICK_START_MODE;
  return STUDY_MODES.find((m) => m.id === id) ?? STUDY_MODES[0];
}
