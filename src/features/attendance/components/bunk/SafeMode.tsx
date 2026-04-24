import { useMemo, useState } from "react";
import { Surface } from "@/core/components/Surface";
import { useStore } from "@/core/store";
import { subjectAttendance, safeSkippable } from "@/features/attendance/logic";

export function SafeMode() {
  const [t, setT] = useState(75);
  const semesters = useStore((s) => s.semesters);
  const attendance = useStore((s) => s.attendance);
  const rows = useMemo(
    () => subjectAttendance(semesters.flatMap((s) => s.subjects), attendance, t),
    [semesters, attendance, t],
  );

  return (
    <div className="space-y-3">
      <Surface className="p-4">
        <label htmlFor="safe-target" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
          Target threshold
        </label>
        <div className="flex items-center gap-3">
          <input
            id="safe-target"
            type="range"
            min="50"
            max="95"
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="flex-1 accent-[color:var(--primary)]"
          />
          <span className="font-display text-2xl font-bold text-neon">{t}%</span>
        </div>
      </Surface>
      <Surface className="p-4">
        <div className="text-sm font-bold mb-3">Maximum classes you can skip without falling below {t}%</div>
        {rows.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No subjects yet.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const skip = safeSkippable(r.present, r.total, t);
              return (
                <div key={r.subject.id} className="flex items-center justify-between rounded-[var(--radius-2)] bg-surface-2 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.subject.color }} aria-hidden="true" />
                    <span className="truncate text-sm font-semibold">{r.subject.name}</span>
                  </div>
                  <div
                    className="font-display text-xl font-bold"
                    style={{ color: skip > 3 ? "var(--success)" : skip > 0 ? "var(--warning)" : "var(--destructive)" }}
                  >
                    {skip}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}
