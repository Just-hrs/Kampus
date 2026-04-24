import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore, type AttendanceStatus } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";
import { isoFromDate, isoToday } from "@/features/attendance/logic";
import { getHoliday, isEffectiveHoliday } from "@/features/attendance/holidays";

interface Props {
  semesterId: string;
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "var(--success)",
  absent: "var(--destructive)",
  cancelled: "var(--muted-foreground)",
};

const MODE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  cancelled: "Cancelled",
};

export function AttendanceCalendar({ semesterId }: Props) {
  const sem = useStore((s) => s.semesters.find((x) => x.id === semesterId));
  const schedule = useStore((s) => s.schedule);
  const attendance = useStore((s) => s.attendance);
  const setAtt = useStore((s) => s.setAttendance);
  const holidayOverrides = useStore((s) => s.holidayOverrides);
  const setHolidayOverride = useStore((s) => s.setHolidayOverride);
  const extraClasses = useStore((s) => s.extraClasses);
  const addExtraClass = useStore((s) => s.addExtraClass);
  const haptic = useHaptics();

  const subjects = sem?.subjects ?? [];
  const [subjectId, setSubjectId] = useState<string>(() => subjects[0]?.id ?? "");
  const [mode, setMode] = useState<AttendanceStatus>("present");
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const activeSubject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const activeId = activeSubject?.id ?? "";

  const scheduledDays = useMemo(() => {
    const days = new Set<number>();
    if (!activeId) return days;
    for (const [day, ids] of Object.entries(schedule)) {
      if ((ids as string[]).includes(activeId)) days.add(Number(day));
    }
    return days;
  }, [schedule, activeId]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const totals = useMemo(() => {
    const t = { present: 0, absent: 0, cancelled: 0 };
    if (!activeId) return t;
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    for (const [k, v] of Object.entries(attendance)) {
      if (!k.startsWith(prefix)) continue;
      const subId = k.split("_").slice(1).join("_");
      if (subId !== activeId) continue;
      if (v in t) t[v as AttendanceStatus]++;
    }
    return t;
  }, [attendance, year, month, activeId]);

  if (!sem) {
    return <Surface className="p-4 text-center text-sm text-muted-foreground">Select a semester.</Surface>;
  }

  if (subjects.length === 0 || !activeSubject) {
    return (
      <Surface className="p-4 text-center text-sm text-muted-foreground">
        Add subjects first to track attendance.
      </Surface>
    );
  }

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; iso?: string; weekday?: number }> = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ day: d, iso: isoFromDate(date), weekday: date.getDay() });
  }

  const handleCellClick = (iso: string, weekday: number) => {
    const isHol = isEffectiveHoliday(iso, holidayOverrides);
    const isScheduled = scheduledDays.has(weekday) && !isHol;
    const key = `${iso}_${activeSubject.id}`;
    const cur = attendance[key];
    const hasExtra = extraClasses.some((x) => x.dateISO === iso && x.subjectId === activeSubject.id);

    if (isHol && !cur && !hasExtra) {
      const hol = getHoliday(iso);
      const ok = confirm(
        `Chhutti hai so ja 😴 — ${hol?.name ?? "Holiday"}.\n\nNah, it's a misunderstanding — today there are classes?`,
      );
      if (!ok) return;
      setHolidayOverride(iso, "working");
      haptic("warning");
      return;
    }
    if (!isScheduled && !cur && !hasExtra) {
      if (!confirm("Extra class? Add this class for today?")) return;
      addExtraClass({ dateISO: iso, subjectId: activeSubject.id });
      setAtt(iso, activeSubject.id, mode);
      haptic("tick");
      return;
    }
    setAtt(iso, activeSubject.id, cur === mode ? null : mode);
    haptic("tick");
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  const today = isoToday();

  return (
    <div className="space-y-3">
      <Surface className="p-3 space-y-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Subject</div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {sem.subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                aria-pressed={s.id === activeSubject.id}
                className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all ${
                  s.id === activeSubject.id ? "text-primary-foreground" : "surface-glass"
                }`}
                style={s.id === activeSubject.id ? { background: s.color } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Mode</div>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(MODE_LABELS) as AttendanceStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setMode(s)}
                aria-pressed={mode === s}
                className="h-9 rounded-full text-xs font-bold transition-all"
                style={{
                  background: mode === s ? STATUS_COLORS[s] : "var(--surface-2)",
                  color: mode === s ? "white" : "var(--muted-foreground)",
                }}
              >
                {MODE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </Surface>

      <Surface className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-full surface-glass" aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <div className="text-sm font-bold">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
          <button onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-full surface-glass" aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-muted-foreground mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.day || !cell.iso) return <div key={i} className="aspect-square" />;
            const status = attendance[`${cell.iso}_${activeSubject.id}`] as AttendanceStatus | undefined;
            const isHol = isEffectiveHoliday(cell.iso, holidayOverrides);
            const isScheduled = scheduledDays.has(cell.weekday!) && !isHol;
            const hasExtra = extraClasses.some((x) => x.dateISO === cell.iso && x.subjectId === activeSubject.id);
            const isToday = cell.iso === today;
            const bg = status
              ? STATUS_COLORS[status]
              : isHol
                ? "color-mix(in oklab, var(--warning) 15%, transparent)"
                : isScheduled || hasExtra
                  ? "color-mix(in oklab, " + activeSubject.color + " 25%, transparent)"
                  : "var(--surface-2)";
            const fg = status ? "white" : isHol ? "var(--warning)" : isScheduled || hasExtra ? "var(--foreground)" : "var(--muted-foreground)";
            return (
              <button
                key={i}
                onClick={() => handleCellClick(cell.iso!, cell.weekday!)}
                className="relative aspect-square rounded-lg text-xs font-semibold transition-all active:scale-95"
                style={{
                  background: bg,
                  color: fg,
                  opacity: isScheduled || status || isHol || hasExtra ? 1 : 0.55,
                  outline: isToday ? "1.5px solid var(--ring)" : undefined,
                }}
                aria-label={`${cell.iso}${status ? `, ${status}` : ""}${isHol ? `, holiday` : ""}`}
              >
                {cell.day}
                {hasExtra && !status && (
                  <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      </Surface>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(MODE_LABELS) as AttendanceStatus[]).map((s) => (
          <Surface key={s} className="p-2.5 text-center">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{MODE_LABELS[s]}</div>
            <div className="font-display text-2xl font-bold" style={{ color: STATUS_COLORS[s] }}>
              {totals[s]}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
