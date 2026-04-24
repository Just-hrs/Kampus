import type { Subject } from "@/core/store";
import type { SubjectAttendance } from "./logic";

export interface YoloVerdict {
  range: [number, number];
  line: string;
  vibe: "ok" | "warn" | "danger" | "doom";
}

export const YOLO_VERDICTS: readonly YoloVerdict[] = [
  { range: [0, 5], line: "Mild rebellion. The system tolerates this.", vibe: "ok" },
  { range: [5, 10], line: "You're flirting with the danger zone.", vibe: "warn" },
  { range: [10, 20], line: "Attendance committee is sharpening pencils.", vibe: "danger" },
  { range: [20, 50], line: "Your name is now a cautionary tale.", vibe: "doom" },
  { range: [50, 1000], line: "RIP. Pack your bags. The void calls.", vibe: "doom" },
];

export function pickYoloVerdict(n: number): YoloVerdict {
  return YOLO_VERDICTS.find((v) => n >= v.range[0] && n < v.range[1]) ?? YOLO_VERDICTS[0];
}

/** CSS color token for a yolo verdict vibe. */
export function vibeColor(vibe: YoloVerdict["vibe"]): string {
  if (vibe === "ok") return "var(--success)";
  if (vibe === "warn") return "var(--warning)";
  return "var(--destructive)";
}

/** Resolve subject ids for a given weekday from schedule + subject pool. */
export function subjectsForDay(
  weekdaySubIds: readonly string[],
  subjects: Subject[],
): Subject[] {
  const map = new Map(subjects.map((s) => [s.id, s]));
  return weekdaySubIds.map((id) => map.get(id)).filter((s): s is Subject => Boolean(s));
}

/** Build a quick lookup row map by subject id. */
export function rowMap(rows: SubjectAttendance[]): Map<string, SubjectAttendance> {
  return new Map(rows.map((r) => [r.subject.id, r]));
}
