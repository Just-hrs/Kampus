import type { Semester, Subject } from "@/core/store";

// Numeric 10-point scale: 10, 9, 8, 7, 6, 5, 0 (F)
export const GRADE_POINTS: Record<string, number> = {
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "0": 0,
};

export const GRADE_LETTERS: readonly string[] = ["10", "9", "8", "7", "6", "5", "0"];

export const GRADE_COLORS: Record<string, string> = {
  "10": "var(--success)",
  "9": "var(--success)",
  "8": "var(--accent)",
  "7": "var(--accent)",
  "6": "var(--warning)",
  "5": "var(--warning)",
  "0": "var(--destructive)",
};

export function calcSGPA(sem: Semester): number {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const sub of sem.subjects) {
    const grade = sem.grades[sub.id];
    if (!grade || !(grade in GRADE_POINTS)) continue;
    totalCredits += sub.credits;
    totalPoints += GRADE_POINTS[grade] * sub.credits;
  }
  if (totalCredits === 0) return 0;
  return totalPoints / totalCredits;
}

export function calcCGPA(semesters: Semester[]): number {
  let totalCredits = 0;
  let totalPoints = 0;
  for (const sem of semesters) {
    for (const sub of sem.subjects) {
      const grade = sem.grades[sub.id];
      if (!grade || !(grade in GRADE_POINTS)) continue;
      totalCredits += sub.credits;
      totalPoints += GRADE_POINTS[grade] * sub.credits;
    }
  }
  if (totalCredits === 0) return 0;
  return totalPoints / totalCredits;
}

export function semesterCompletion(sem: Semester): number {
  if (sem.subjects.length === 0) return 0;
  const graded = sem.subjects.filter((s) => sem.grades[s.id]).length;
  return graded / sem.subjects.length;
}

export interface SubjectAnalytics {
  subject: Subject;
  grade: string | null;
  points: number;
}

export function subjectAnalytics(sem: Semester): SubjectAnalytics[] {
  return sem.subjects.map((sub) => {
    const grade = sem.grades[sub.id] ?? null;
    return {
      subject: sub,
      grade,
      points: grade && grade in GRADE_POINTS ? GRADE_POINTS[grade] : 0,
    };
  });
}

export function strongestSubject(sem: Semester): SubjectAnalytics | null {
  const graded = subjectAnalytics(sem).filter((a) => a.grade !== null);
  if (graded.length === 0) return null;
  return graded.reduce((max, cur) => (cur.points > max.points ? cur : max));
}

export function weakestSubject(sem: Semester): SubjectAnalytics | null {
  const graded = subjectAnalytics(sem).filter((a) => a.grade !== null);
  if (graded.length === 0) return null;
  return graded.reduce((min, cur) => (cur.points < min.points ? cur : min));
}

export interface TargetStrategy {
  id: "chill" | "recovery" | "aggressive" | "safe";
  label: string;
  vibe: string;
  requiredSGPA: number;
  feasible: boolean;
  blurb: string;
  emoji: string;
}

/**
 * Given current CGPA, completed semesters, total semesters, and target CGPA,
 * compute 4 strategies for the remaining semesters.
 */
export function targetStrategies(
  currentCGPA: number,
  completedCredits: number,
  remainingCredits: number,
  targetCGPA: number,
): TargetStrategy[] {
  const need =
    remainingCredits > 0
      ? (targetCGPA * (completedCredits + remainingCredits) - currentCGPA * completedCredits) /
        remainingCredits
      : targetCGPA;

  const required = Math.max(0, Math.min(10, need));

  const make = (
    id: TargetStrategy["id"],
    label: string,
    vibe: string,
    add: number,
    blurb: string,
    emoji: string,
  ): TargetStrategy => {
    const r = Math.max(0, Math.min(10, required + add));
    return {
      id,
      label,
      vibe,
      requiredSGPA: r,
      feasible: r <= 10,
      blurb,
      emoji,
    };
  };

  return [
    make("chill", "Chill Route", "Low effort, realistic", -0.4, "Coast a bit. Don't tank. You'll be fine.", "🌊"),
    make("safe", "Safe Route", "Buffer + insurance", 0, "The math says this. Hit it. Don't deviate.", "🛡️"),
    make("recovery", "Recovery Route", "Bounce-back path", 0.4, "You slipped. Climb. The view at the top is petty.", "📈"),
    make("aggressive", "Aggressive Route", "Sweat-mode, tight margins", 0.8, "Lock in. Lock OUT distractions. Run it.", "🔥"),
  ];
}

export interface SGPATrendPoint {
  semNumber: number;
  sgpa: number;
  cgpa: number;
}

export function sgpaTrend(semesters: Semester[]): SGPATrendPoint[] {
  const points: SGPATrendPoint[] = [];
  let cumCredits = 0;
  let cumPoints = 0;
  for (const sem of [...semesters].sort((a, b) => a.number - b.number)) {
    const sgpa = calcSGPA(sem);
    let semCredits = 0;
    let semPoints = 0;
    for (const sub of sem.subjects) {
      const g = sem.grades[sub.id];
      if (!g || !(g in GRADE_POINTS)) continue;
      semCredits += sub.credits;
      semPoints += GRADE_POINTS[g] * sub.credits;
    }
    cumCredits += semCredits;
    cumPoints += semPoints;
    points.push({
      semNumber: sem.number,
      sgpa,
      cgpa: cumCredits > 0 ? cumPoints / cumCredits : 0,
    });
  }
  return points;
}
