import { useMemo, useState } from "react";
import { Target } from "lucide-react";
import { Surface } from "@/core/components/Surface";
import { targetStrategies } from "@/features/grades/logic";
import type { Semester } from "@/core/store";

interface TargetPanelProps {
  cgpa: number;
  semesters: Semester[];
  totalSemesters: number;
}

export function TargetPanel({ cgpa, semesters, totalSemesters }: TargetPanelProps) {
  const [target, setTarget] = useState(8.5);

  const strategies = useMemo(() => {
    let completedCredits = 0;
    for (const sem of semesters) {
      for (const sub of sem.subjects) {
        if (sem.grades[sub.id]) completedCredits += sub.credits;
      }
    }
    const completedSems = semesters.filter((s) =>
      Object.values(s.grades).some((g) => g),
    ).length;
    const avgPerSem = completedSems > 0 ? completedCredits / completedSems : 24;
    const remainingCredits = Math.max(0, (totalSemesters - completedSems) * avgPerSem);
    return targetStrategies(cgpa, completedCredits, remainingCredits, target);
  }, [semesters, totalSemesters, cgpa, target]);

  return (
    <Surface className="p-4">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-primary" aria-hidden="true" />
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Target Strategy Engine
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="cgpa-target" className="text-xs text-muted-foreground">
          Target CGPA
        </label>
        <input
          id="cgpa-target"
          type="range"
          min="6"
          max="10"
          step="0.1"
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="flex-1 accent-[color:var(--primary)]"
          aria-valuetext={target.toFixed(1)}
        />
        <span className="w-12 font-mono text-sm font-bold">{target.toFixed(1)}</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {strategies.map((st) => (
          <div
            key={st.id}
            className="rounded-[var(--radius-2)] border border-border bg-surface-2 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span aria-hidden="true">{st.emoji}</span>
                <span className="text-sm font-bold">{st.label}</span>
              </div>
              <div
                className="font-mono text-base font-bold"
                style={{ color: st.feasible ? "var(--primary)" : "var(--destructive)" }}
              >
                {st.requiredSGPA.toFixed(2)}
              </div>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {st.vibe}
            </div>
            <div className="mt-1.5 text-xs">{st.blurb}</div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
