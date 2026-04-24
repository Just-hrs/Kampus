import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useStore } from "@/core/store";
import { Surface } from "@/core/components/Surface";
import { calcCGPA } from "@/features/grades/logic";
import { subjectAttendance, overallPercentage } from "@/features/attendance/logic";
import { monthlyTotal, necessaryUnnecessary } from "@/features/expenses/logic";
import { Signature } from "@/core/components/Signature";


export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

interface Insight {
  id: string;
  severity: "info" | "warn" | "danger" | "success";
  title: string;
  body: string;
  emoji: string;
}

function InsightsPage() {
  const semesters = useStore((s) => s.semesters);
  const attendance = useStore((s) => s.attendance);
  const target = useStore((s) => s.settings.attendanceTarget);
  const expenses = useStore((s) => s.expenses);
  const budget = useStore((s) => s.monthlyBudget);
  const streak = useStore((s) => s.streaks.current);

  const cgpa = calcCGPA(semesters);
  const allSubs = semesters.flatMap((s) => s.subjects);
  const att = subjectAttendance(allSubs, attendance, target);
  const overall = overallPercentage(att);

  const now = new Date();
  const monthSpend = monthlyTotal(expenses, now.getFullYear(), now.getMonth());
  const { necessary, unnecessary } = necessaryUnnecessary(expenses, now.getFullYear(), now.getMonth());

  const insights: Insight[] = [];

  // Attendance rules
  const dangerSubs = att.filter((a) => a.percentage < target);
  if (dangerSubs.length > 0) {
    insights.push({
      id: "att-danger",
      severity: "danger",
      title: `${dangerSubs.length} subject${dangerSubs.length > 1 ? "s" : ""} below target`,
      body: `${dangerSubs.map((s) => s.subject.name).join(", ")} need recovery. Time to lock in.`,
      emoji: "⚠️",
    });
  } else if (att.length > 0) {
    insights.push({
      id: "att-good",
      severity: "success",
      title: "Attendance dialed in",
      body: `${overall.toFixed(0)}% overall. Your future self approves.`,
      emoji: "✅",
    });
  }

  // Spending rules
  if (monthSpend > budget) {
    insights.push({
      id: "spend-over",
      severity: "warn",
      title: "Over budget",
      body: `You've spent ₹${(monthSpend - budget).toFixed(0)} above budget. Slow down or rebudget.`,
      emoji: "💸",
    });
  }
  if (unnecessary > necessary && monthSpend > 0) {
    insights.push({
      id: "vibes-heavy",
      severity: "warn",
      title: "Vibes > Needs this month",
      body: `${((unnecessary / monthSpend) * 100).toFixed(0)}% of spend was non-essential. Worth it?`,
      emoji: "🎉",
    });
  }

  // Streak rules
  if (streak >= 7) {
    insights.push({
      id: "streak-fire",
      severity: "success",
      title: `${streak}-day streak`,
      body: "You're building. Don't break the chain.",
      emoji: "🔥",
    });
  } else if (streak === 0) {
    insights.push({
      id: "streak-cold",
      severity: "info",
      title: "No active streak",
      body: "Mark today's attendance to start a streak. Small win, big compound.",
      emoji: "✨",
    });
  }

  // Grades rules
  if (cgpa > 0 && cgpa < 7) {
    insights.push({
      id: "cgpa-recover",
      severity: "warn",
      title: "CGPA recovery zone",
      body: `Currently ${cgpa.toFixed(2)}. Plan strategically — visit Grades → Target Engine.`,
      emoji: "📈",
    });
  } else if (cgpa >= 8.5) {
    insights.push({
      id: "cgpa-strong",
      severity: "success",
      title: "CGPA in elite tier",
      body: `${cgpa.toFixed(2)}. Maintain. The peak is lonely but worth it.`,
      emoji: "🏆",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "empty",
      severity: "info",
      title: "Not enough data yet",
      body: "Add grades, mark attendance, log expenses. Insights show up as patterns emerge.",
      emoji: "🌱",
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pt-2 pb-8">
      <Signature page="insights" />
      <Surface className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <div className="text-sm font-bold">Cross-feature analysis</div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {insights.length} insight{insights.length === 1 ? "" : "s"} from your last 30 days.
        </div>
      </Surface>

      {insights.map((i) => (
        <Surface key={i.id} className="p-4 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full w-1"
            style={{
              background:
                i.severity === "danger"
                  ? "var(--destructive)"
                  : i.severity === "warn"
                    ? "var(--warning)"
                    : i.severity === "success"
                      ? "var(--success)"
                      : "var(--accent)",
            }}
          />
          <div className="flex items-start gap-3 pl-2">
            <div className="text-2xl shrink-0">{i.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {i.severity === "danger" && <AlertTriangle size={14} className="text-destructive" />}
                {i.severity === "warn" && <TrendingDown size={14} className="text-warning" />}
                {i.severity === "success" && <TrendingUp size={14} className="text-success" />}
                <div className="text-sm font-bold">{i.title}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{i.body}</div>
            </div>
          </div>
        </Surface>
      ))}
      <Link
  to="/attendance/bunk"
  className="block rounded-2xl border border-border p-4"
>
  Open Bunk Planner
</Link>
    </div>
  );
}
