import type { Semester } from "@/core/store";
import type { Expense } from "@/core/store";
import { calcCGPA } from "@/features/grades/logic";
import { subjectAttendance, overallPercentage } from "@/features/attendance/logic";
import { monthlyTotal, necessaryUnnecessary } from "@/features/expenses/logic";
import type { AttendanceRecord } from "@/core/store";

export type Severity = "info" | "warn" | "danger" | "success";

export interface Insight {
  id: string;
  severity: Severity;
  title: string;
  body: string;
  emoji: string;
}

export interface InsightInput {
  semesters: Semester[];
  attendance: AttendanceRecord;
  target: number;
  expenses: Expense[];
  budget: number;
  streak: number;
  now?: Date;
}

/**
 * Compute insight cards from raw store slices. Pure & memoizable.
 * Each rule is a function returning Insight | null and pushed in order
 * so adding a new insight rule = appending one function below.
 */
export function computeInsights(input: InsightInput): Insight[] {
  const now = input.now ?? new Date();
  const cgpa = calcCGPA(input.semesters);
  const allSubs = input.semesters.flatMap((s) => s.subjects);
  const att = subjectAttendance(allSubs, input.attendance, input.target);
  const overall = overallPercentage(att);
  const monthSpend = monthlyTotal(input.expenses, now.getFullYear(), now.getMonth());
  const { necessary, unnecessary } = necessaryUnnecessary(
    input.expenses,
    now.getFullYear(),
    now.getMonth(),
  );

  const out: Insight[] = [];

  // Attendance
  const danger = att.filter((a) => a.percentage < input.target);
  if (danger.length > 0) {
    out.push({
      id: "att-danger",
      severity: "danger",
      title: `${danger.length} subject${danger.length > 1 ? "s" : ""} below target`,
      body: `${danger.map((s) => s.subject.name).join(", ")} need recovery. Time to lock in.`,
      emoji: "⚠️",
    });
  } else if (att.length > 0) {
    out.push({
      id: "att-good",
      severity: "success",
      title: "Attendance dialed in",
      body: `${overall.toFixed(0)}% overall. Your future self approves.`,
      emoji: "✅",
    });
  }

  // Spending
  if (monthSpend > input.budget) {
    out.push({
      id: "spend-over",
      severity: "warn",
      title: "Over budget",
      body: `You've spent ₹${(monthSpend - input.budget).toFixed(0)} above budget. Slow down or rebudget.`,
      emoji: "💸",
    });
  }
  if (unnecessary > necessary && monthSpend > 0) {
    out.push({
      id: "vibes-heavy",
      severity: "warn",
      title: "Vibes > Needs this month",
      body: `${((unnecessary / monthSpend) * 100).toFixed(0)}% of spend was non-essential. Worth it?`,
      emoji: "🎉",
    });
  }

  // Streak
  if (input.streak >= 7) {
    out.push({
      id: "streak-fire",
      severity: "success",
      title: `${input.streak}-day streak`,
      body: "You're building. Don't break the chain.",
      emoji: "🔥",
    });
  } else if (input.streak === 0) {
    out.push({
      id: "streak-cold",
      severity: "info",
      title: "No active streak",
      body: "Mark today's attendance to start a streak. Small win, big compound.",
      emoji: "✨",
    });
  }

  // Grades
  if (cgpa > 0 && cgpa < 7) {
    out.push({
      id: "cgpa-recover",
      severity: "warn",
      title: "CGPA recovery zone",
      body: `Currently ${cgpa.toFixed(2)}. Plan strategically — visit Grades → Target Engine.`,
      emoji: "📈",
    });
  } else if (cgpa >= 8.5) {
    out.push({
      id: "cgpa-strong",
      severity: "success",
      title: "CGPA in elite tier",
      body: `${cgpa.toFixed(2)}. Maintain. The peak is lonely but worth it.`,
      emoji: "🏆",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "empty",
      severity: "info",
      title: "Not enough data yet",
      body: "Add grades, mark attendance, log expenses. Insights show up as patterns emerge.",
      emoji: "🌱",
    });
  }

  return out;
}

export function severityColor(s: Severity): string {
  if (s === "danger") return "var(--destructive)";
  if (s === "warn") return "var(--warning)";
  if (s === "success") return "var(--success)";
  return "var(--accent)";
}
