import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Minus, Rocket, ChevronLeft, ChevronRight, CalendarCog } from "lucide-react";
import { useStore } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Surface } from "@/core/components/Surface";
import { CountUp } from "@/core/components/CountUp";
import { RingProgress } from "@/core/components/RingProgress";
import { Signature } from "@/core/components/Signature";
import { subjectAttendance, overallPercentage, isoToday, isoFromDate, safeSkippable } from "@/features/attendance/logic";
import { isEffectiveHoliday, getHoliday } from "@/features/attendance/holidays";
import { SubjectManager } from "@/features/attendance/components/SubjectManager";
import { AttendanceCalendar } from "@/features/attendance/components/AttendanceCalendar";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AttendancePage() {
  const hydrated = useHydrated();
  const semesters = useStore((s) => s.semesters);
  const activeSemId = useStore((s) => s.activeSemesterId);
  const setActiveSemester = useStore((s) => s.setActiveSemester);
  const schedule = useStore((s) => s.schedule);
  const attendance = useStore((s) => s.attendance);
  const holidayOverrides = useStore((s) => s.holidayOverrides);
  const setHolidayOverride = useStore((s) => s.setHolidayOverride);
  const extraClasses = useStore((s) => s.extraClasses);
  const target = useStore((s) => s.settings.attendanceTarget);
  const setAtt = useStore((s) => s.setAttendance);
  const bumpStreak = useStore((s) => s.bumpStreak);
  const haptic = useHaptics();

  const [date, setDate] = useState(() => new Date());
  const dateISO = isoFromDate(date);
  const weekday = date.getDay();
  const todayISO = isoToday();
  const isToday = dateISO === todayISO;

  // Current semester ONLY
  const activeSem = useMemo(
    () => semesters.find((s) => s.id === activeSemId) ?? semesters[semesters.length - 1],
    [semesters, activeSemId],
  );
  const currentSubs = activeSem?.subjects ?? [];
  const subsById = useMemo(() => new Map(currentSubs.map((s) => [s.id, s])), [currentSubs]);

  const holiday = isEffectiveHoliday(dateISO, holidayOverrides) ? getHoliday(dateISO) : null;
  const todayExtras = extraClasses
    .filter((x) => x.dateISO === dateISO)
    .map((x) => subsById.get(x.subjectId))
    .filter(Boolean) as typeof currentSubs;

  const todaySubs = holiday
    ? todayExtras
    : ([...((schedule[weekday] ?? []).map((id) => subsById.get(id)).filter(Boolean) as typeof currentSubs), ...todayExtras]);

  const rows = useMemo(() => subjectAttendance(currentSubs, attendance, target), [currentSubs, attendance, target]);
  const overall = overallPercentage(rows);

  const calendarSemId = activeSem?.id ?? "";

  const mark = (subId: string, status: "present" | "absent" | "cancelled") => {
    const key = `${dateISO}_${subId}`;
    const cur = attendance[key];
    setAtt(dateISO, subId, cur === status ? null : status);
    haptic(status === "present" ? "success" : status === "absent" ? "warning" : "tick");
    if (isToday && status === "present") bumpStreak();
  };

  const shiftDay = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d);
    haptic("tick");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-2">
      {/* Overall + target */}
      <Surface className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Overall · avg of subjects
            </div>
            <div className="mt-1 text-4xl font-display font-bold">
              {hydrated ? <CountUp value={overall} decimals={0} suffix="%" /> : "0%"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Target {target}%</div>
          </div>
          <RingProgress
            value={overall / 100}
            size={88}
            stroke={8}
            color={overall >= target ? "var(--success)" : overall >= target - 5 ? "var(--warning)" : "var(--destructive)"}
          />
        </div>
      </Surface>

      <Signature page="attendance" />

      {/* Action row: bunk planner + edit timetable */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link to="/bunk">
          <Surface className="overflow-hidden p-0" variant="glass">
            <motion.div
              animate={{ background: ["var(--grad-primary)", "var(--grad-aurora)", "var(--grad-primary)"] }}
              transition={{ duration: 8, repeat: Infinity }}
              className="flex items-center gap-3 p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                <Rocket size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">Launch Bunk Planner</div>
                <div className="text-[11px] text-white/80">Plan future days. See live impact.</div>
              </div>
              <ChevronRight size={18} className="text-white" />
            </motion.div>
          </Surface>
        </Link>
        <Link to="/timetable">
          <Surface className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CalendarCog size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold">Edit Timetable</div>
              <div className="text-[11px] text-muted-foreground">Subjects & weekly schedule.</div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Surface>
        </Link>
      </div>

      {/* Date stepper */}
      <Surface className="p-3">
        <div className="flex items-center justify-between">
          <button onClick={() => shiftDay(-1)} className="flex h-10 w-10 items-center justify-center rounded-full surface-glass" aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {DAYS[weekday]}
            </div>
            <div className="text-sm font-semibold">
              {date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </div>
            {!isToday && (
              <button onClick={() => setDate(new Date())} className="text-[10px] text-primary">
                Jump to today
              </button>
            )}
          </div>
          <button onClick={() => shiftDay(1)} className="flex h-10 w-10 items-center justify-center rounded-full surface-glass" aria-label="Next day">
            <ChevronRight size={18} />
          </button>
        </div>
      </Surface>

      {/* Holiday card */}
      {holiday && todayExtras.length === 0 && (
        <Surface className="p-4 flex items-center gap-3" variant="glass">
          <div className="text-3xl" aria-hidden="true">😴</div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{holiday.name}</div>
            <div className="text-sm font-bold">Chhutti hai so ja</div>
          </div>
          <button
            onClick={() => {
              setHolidayOverride(dateISO, "working");
              haptic("warning");
            }}
            className="rounded-full surface-glass px-3 py-1.5 text-[11px] font-semibold"
          >
            Nah, classes hain
          </button>
        </Surface>
      )}

      {/* Day classes */}
      <div className="space-y-2">
        {todaySubs.length === 0 && !holiday ? (
          <Surface className="p-6 text-center text-sm text-muted-foreground">
            No classes scheduled for {DAYS[weekday]}.
            <div className="mt-1 text-[10px]">
              Set up your timetable in <Link to="/attendance/timetable" className="text-primary">Edit Timetable</Link>.
            </div>
          </Surface>
        ) : (
          todaySubs.map((sub) => {
            const status = attendance[`${dateISO}_${sub.id}`];
            return (
              <Surface key={sub.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sub.color }} />
                      <div className="truncate text-sm font-semibold">{sub.name}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <StatusBtn active={status === "present"} onClick={() => mark(sub.id, "present")} color="var(--success)" icon={<Check size={16} />} />
                    <StatusBtn active={status === "absent"} onClick={() => mark(sub.id, "absent")} color="var(--destructive)" icon={<X size={16} />} />
                    <StatusBtn active={status === "cancelled"} onClick={() => mark(sub.id, "cancelled")} color="var(--muted-foreground)" icon={<Minus size={16} />} />
                  </div>
                </div>
              </Surface>
            );
          })
        )}
      </div>

      {/* Subject breakdown — current semester only */}
      <div>
        <div className="px-1 pb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Per Subject · {activeSem?.name}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((r) => {
            const skip = safeSkippable(r.present, r.total, target);
            return (
              <Surface key={r.subject.id} className="p-3">
                <div className="flex items-center gap-3">
                  <RingProgress
                    value={r.percentage / 100}
                    size={48}
                    stroke={5}
                    color={
                      r.status === "danger" ? "var(--destructive)" : r.status === "warning" ? "var(--warning)" : r.status === "ok" ? "var(--accent)" : "var(--success)"
                    }
                    glow={false}
                  >
                    <span className="text-[10px] font-mono font-bold">{Math.round(r.percentage)}</span>
                  </RingProgress>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: r.subject.color }}>
                      {r.subject.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {r.present}P · {r.absent}A · {r.total} held
                    </div>
                    <div className="mt-0.5 text-[10px]">
                      {r.percentage >= target ? (
                        <span className="text-success">Can skip {skip} more</span>
                      ) : (
                        <span className="text-warning">Below target</span>
                      )}
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </div>

      {/* Track Attendance */}
      <div className="pt-2">
        <div className="px-1 pb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Track Attendance
        </div>
        {semesters.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
            {semesters.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSemester(s.id)}
                aria-pressed={s.id === calendarSemId}
                className={`h-9 shrink-0 rounded-full px-3 text-xs font-semibold ${
                  s.id === calendarSemId ? "bg-primary text-primary-foreground" : "surface-glass"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        {calendarSemId && (
          <div className="space-y-3">
            <SubjectManager semesterId={calendarSemId} />
            <AttendanceCalendar semesterId={calendarSemId} />
          </div>
        )}
      </div>

      <div className="h-6" />
      <Outlet />
    </div>
  );
}

function StatusBtn({
  active,
  onClick,
  color,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full transition-all"
      style={{
        background: active ? color : "var(--muted)",
        color: active ? "white" : "var(--muted-foreground)",
        boxShadow: active ? `0 0 16px ${color}` : undefined,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={String(active)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {icon}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
