import { useMemo } from "react";
import { Surface } from "@/core/components/Surface";
import { useStore } from "@/core/store";
import { subjectAttendance, projectSkip } from "@/features/attendance/logic";
import { subjectsForDay, rowMap } from "@/features/attendance/bunk-logic";

export function SurvivalMode() {
  const semesters = useStore((s) => s.semesters);
  const attendance = useStore((s) => s.attendance);
  const target = useStore((s) => s.settings.attendanceTarget);
  const schedule = useStore((s) => s.schedule);

  const { tomorrowSubs, rows } = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const wkd = tomorrow.getDay();
    const allSubs = semesters.flatMap((s) => s.subjects);
    return {
      tomorrowSubs: subjectsForDay(schedule[wkd] ?? [], allSubs),
      rows: subjectAttendance(allSubs, attendance, target),
    };
  }, [semesters, attendance, target, schedule]);

  const map = rowMap(rows);

  return (
    <div className="space-y-3">
      <Surface className="p-4" variant="glass">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Skip tomorrow scenario
        </div>
        <div className="text-sm mt-1 font-bold">
          What if you ghost tomorrow's {tomorrowSubs.length} classes?
        </div>
      </Surface>
      {tomorrowSubs.length === 0 ? (
        <Surface className="p-6 text-center text-sm text-muted-foreground">
          Nothing scheduled tomorrow. Free pass from the universe.
        </Surface>
      ) : (
        <div className="space-y-2">
          {tomorrowSubs.map((sub) => {
            const r = map.get(sub.id);
            if (!r) return null;
            const next = projectSkip(r.present, r.total, 1);
            const safe = next >= target;
            return (
              <Surface key={sub.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: sub.color }} aria-hidden="true" />
                    <div className="truncate text-sm font-semibold">{sub.name}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-display text-xl font-bold"
                      style={{ color: safe ? "var(--success)" : "var(--destructive)" }}
                    >
                      {next.toFixed(0)}%
                    </div>
                    <div className="text-[10px]" style={{ color: safe ? "var(--success)" : "var(--destructive)" }}>
                      {safe ? "Safe to bunk" : "Risk zone"}
                    </div>
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
