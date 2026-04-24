import { useMemo, useState } from "react";
import { Surface } from "@/core/components/Surface";
import { useStore } from "@/core/store";
import { subjectAttendance, projectSkip } from "@/features/attendance/logic";
import { pickYoloVerdict, vibeColor } from "@/features/attendance/bunk-logic";

export function YoloMode() {
  const [n, setN] = useState(5);
  const semesters = useStore((s) => s.semesters);
  const attendance = useStore((s) => s.attendance);
  const target = useStore((s) => s.settings.attendanceTarget);
  const rows = useMemo(
    () => subjectAttendance(semesters.flatMap((s) => s.subjects), attendance, target),
    [semesters, attendance, target],
  );

  const verdict = pickYoloVerdict(n);

  return (
    <div className="space-y-3">
      <Surface className="p-4">
        <label htmlFor="yolo-skip" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
          How many classes are you ABOUT to skip?
        </label>
        <div className="flex items-center gap-3">
          <input
            id="yolo-skip"
            type="range"
            min="0"
            max="40"
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="flex-1 accent-[color:var(--primary)]"
          />
          <span className="font-display text-3xl font-bold text-neon">{n}</span>
        </div>
      </Surface>
      <Surface className="p-4" variant="glass">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Verdict</div>
        <div className="mt-2 text-base font-bold" style={{ color: vibeColor(verdict.vibe) }}>
          {verdict.line}
        </div>
      </Surface>
      <Surface className="p-4">
        <div className="text-sm font-bold mb-3">Projected damage per subject</div>
        <div className="space-y-2">
          {rows.map((r) => {
            const newPct = projectSkip(r.present, r.total, n);
            const drop = r.percentage - newPct;
            return (
              <div key={r.subject.id} className="flex items-center justify-between rounded-[var(--radius-2)] bg-surface-2 p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.subject.color }} aria-hidden="true" />
                  <span className="truncate text-sm font-semibold">{r.subject.name}</span>
                </div>
                <div className="text-right">
                  <div
                    className="font-display text-lg font-bold"
                    style={{ color: newPct >= target ? "var(--success)" : "var(--destructive)" }}
                  >
                    {newPct.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground">−{drop.toFixed(1)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </div>
  );
}
