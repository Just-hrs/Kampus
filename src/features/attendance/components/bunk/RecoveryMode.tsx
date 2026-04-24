import { useMemo } from "react";
import { Surface } from "@/core/components/Surface";
import { useStore } from "@/core/store";
import { subjectAttendance, recoveryClasses } from "@/features/attendance/logic";

export function RecoveryMode() {
  const semesters = useStore((s) => s.semesters);
  const attendance = useStore((s) => s.attendance);
  const target = useStore((s) => s.settings.attendanceTarget);
  const rows = useMemo(
    () => subjectAttendance(semesters.flatMap((s) => s.subjects), attendance, target),
    [semesters, attendance, target],
  );

  const danger = rows.filter((r) => r.percentage < target);

  return (
    <div className="space-y-3">
      <Surface className="p-4">
        <div className="text-sm font-bold">Recovery plan to hit {target}%</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Consecutive classes you must attend with zero misses.
        </div>
      </Surface>
      {danger.length === 0 ? (
        <Surface className="p-6 text-center">
          <div className="text-3xl mb-2" aria-hidden="true">🎯</div>
          <div className="text-sm font-bold">All subjects above target.</div>
          <div className="text-xs text-muted-foreground mt-1">Maintain. Don't get cocky.</div>
        </Surface>
      ) : (
        <div className="space-y-2">
          {danger.map((r) => {
            const need = recoveryClasses(r.present, r.total, target);
            return (
              <Surface key={r.subject.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.subject.color }} aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">{r.subject.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Currently {r.percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-bold text-warning">{need}</div>
                    <div className="text-[10px] text-muted-foreground">classes in a row</div>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}
