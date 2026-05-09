import type { StudyCore } from "./studyCore";

export function getDailyData(sessions: number[]) {
  // simple mock structure (replace later with real timestamps)
  return sessions.map((s, i) => ({
    day: i + 1,
    value: s,
  }));
}

export function getFocusScore(seconds: number) {
  if (seconds < 120) return 20;
  if (seconds < 300) return 50;
  if (seconds < 900) return 80;
  return 100;
}

export function getInsight(elapsed: number) {
  if (elapsed < 120) return "Just starting counts. Don’t restart.";
  if (elapsed < 300) return "Good warmup. Momentum building.";
  if (elapsed < 900) return "Solid focus zone.";
  return "Deep focus achieved. Don’t break it early.";
}
