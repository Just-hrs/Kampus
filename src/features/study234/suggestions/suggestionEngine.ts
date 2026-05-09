import type { DayPlan } from "../planner/types";
import type { StudySession } from "../types";

const DAY_MS = 86_400_000;

function getToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getSuggestion(params: {
  plan?: DayPlan;
  sessions: StudySession[];
  lastActiveAt?: number | null;
}) {
  const { plan, sessions, lastActiveAt } = params;

  const now = Date.now();
  const today = getToday();

  const todaySessions = sessions.filter(
    (s) => new Date(s.startedAt).setHours(0,0,0,0) === today
  );

  const actualTodayMin =
    todaySessions.reduce((acc, s) => acc + s.durationSec / 60, 0);

  const planned = plan?.plannedTotal ?? 0;

  const progress = planned === 0 ? 1 : actualTodayMin / planned;

  const inactivityHours =
    lastActiveAt ? (now - lastActiveAt) / (1000 * 60 * 60) : 999;

  // ---------------------------
  // RULE 1: user is inactive
  // ---------------------------
  if (inactivityHours > 20) {
    return {
      type: "MICRO_START",
      modeId: "firestart_loop",
      reason: "You’re restarting after a break. Keep it tiny.",
      intensity: "low",
      recommendedMin: 5,
    };
  }

  // ---------------------------
  // RULE 2: user behind plan
  // ---------------------------
  if (progress < 0.5) {
    return {
      type: "CATCH_UP",
      modeId: "auto_pilot",
      reason: "You’re behind today’s plan. Reduce friction.",
      intensity: "high",
      recommendedMin: 10,
    };
  }

  // ---------------------------
  // RULE 3: moderate progress
  // ---------------------------
  if (progress < 0.9) {
    return {
      type: "START_BLOCK",
      modeId: plan?.blocks?.[0]?.modeHint ?? "deep_run",
      reason: "Continue current flow.",
      intensity: "medium",
      recommendedMin: 25,
    };
  }

  // ---------------------------
  // RULE 4: completed enough
  // ---------------------------
  return {
    type: "REST",
    modeId: "soft_reset",
    reason: "You’ve done enough for today. Recover.",
    intensity: "low",
    recommendedMin: 0,
  };
}