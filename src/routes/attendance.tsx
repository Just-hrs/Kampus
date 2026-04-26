import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Minus, Rocket, ChevronLeft, ChevronRight, CalendarCog,BookOpen, } from "lucide-react";
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
  //const setActiveSemester = useStore((s) => s.setActiveSemester);
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

  const globalSemesterId = useStore((s) => s.activeSemesterId);
  const [selectedSemesterId, setSelectedSemesterId] = useState(
    globalSemesterId
  );

  // Current semester ONLY
  const activeSem = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) ?? semesters[semesters.length - 1],
    [semesters, selectedSemesterId],
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
      {/* Header Card */}
      {/* <Surface className="relative overflow-hidden p-4">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_45%)]" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
              Attendance Overview
            </div>

            <div className="mt-1 flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />

              <h2 className="truncate text-lg font-black tracking-tight">
                {selectedSemesterId
                  ? activeSem?.name
                  : "Semesters"}
              </h2>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-surface-2 px-2 py-1">
                {rows.length} subjects
              </span>

              <span className="rounded-full bg-surface-2 px-2 py-1">
                Target {target}%
              </span>

              <span className="rounded-full bg-surface-2 px-2 py-1">
                Avg of subjects
              </span>
            </div>
          </div>

          <RingProgress
            value={overall / 100}
            size={72}
            stroke={6}
            color={
              overall < target - 10
                ? "var(--destructive)"
                : overall < target
                  ? "var(--warning)"
                  : "var(--success)"
            }
            glow
          >
            <div className="text-center">
              <div className="text-[18px] font-black leading-none">
                {hydrated ? Math.round(overall) : 0}
              </div>

              <div className="mt-0.5 text-[9px] font-mono uppercase text-muted-foreground">
                overall
              </div>
            </div>
          </RingProgress>
        </div>
      </Surface> */}

      <Signature page="attendance" />


      {/* Main Attendance Card */}
      <div className="space-y-3">
        <Surface className="relative overflow-hidden p-4">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary blur-3xl" />
          </div>

          <div className="relative">
            {/* Date Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                aria-label="Previous day"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2/80 transition-all active:scale-95"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
                  {DAYS[weekday]}
                </div>

                <div className="mt-1 text-2xl font-black tracking-tight">
                  {date.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                  })}
                </div>

                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {date.toLocaleDateString(undefined, {
                    year: "numeric",
                  })}
                </div>

                {!isToday && (
                  <button
                    type="button"
                    onClick={() => setDate(new Date())}
                    className="mt-2 text-[11px] font-semibold text-primary"
                  >
                    Jump to today
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => shiftDay(1)}
                aria-label="Next day"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-2/80 transition-all active:scale-95"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Holiday */}
            {holiday && todayExtras.length === 0 && (
              <div className="mt-5 rounded-3xl border border-border/40 bg-surface-2/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-2xl">
                    😴
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                      {holiday.name}
                    </div>

                    <div className="mt-1 text-base font-black tracking-tight">
                      Chhutti hai so ja
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHolidayOverride(dateISO, "working");
                      haptic("warning");
                    }}
                    className="rounded-2xl bg-background px-3 py-2 text-[11px] font-semibold"
                  >
                    Classes hain
                  </button>
                </div>
              </div>
            )}

            {/* Subject List */}
            <div className="mt-5 space-y-2">
              {todaySubs.length === 0 && !holiday ? (
                <div className="rounded-3xl bg-surface-2/60 p-6 text-center">
                  <div className="text-sm font-medium text-muted-foreground">
                    No classes scheduled
                  </div>

                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Setup timetable in{" "}
                    <Link
                      to="/attendance/timetable"
                      className="font-semibold text-primary"
                    >
                      Edit Timetable
                    </Link>
                  </div>
                </div>
              ) : (
                todaySubs.map((sub) => {
                  const status =
                    attendance[`${dateISO}_${sub.id}`];

                  return (
                    <div
                      key={sub.id}
                      className={`rounded-3xl border p-3 transition-all ${
                        status === "present"
                          ? "border-success/30 bg-success/10"
                          : status === "absent"
                            ? "border-destructive/30 bg-destructive/10"
                            : status === "cancelled"
                              ? "border-border/40 bg-surface-2/70 opacity-70"
                              : "border-border/40 bg-surface-2/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* subject identity */}
                        <div
                          className="h-11 w-1.5 rounded-full"
                          style={{
                            background: sub.color,
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-bold tracking-tight">
                            {sub.name}
                          </div>

                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {status === "present"
                              ? "Marked present"
                              : status === "absent"
                                ? "Marked absent"
                                : status === "cancelled"
                                  ? "Class cancelled"
                                  : "Not marked yet"}
                          </div>
                        </div>

                        {/* action buttons */}
                        <div className="flex items-center gap-1.5">
                          <StatusBtn
                            active={status === "present"}
                            onClick={() =>
                              mark(sub.id, "present")
                            }
                            color="var(--success)"
                            icon={<Check size={16} />}
                          />

                          <StatusBtn
                            active={status === "absent"}
                            onClick={() =>
                              mark(sub.id, "absent")
                            }
                            color="var(--destructive)"
                            icon={<X size={16} />}
                          />

                          <StatusBtn
                            active={
                              status === "cancelled"
                            }
                            onClick={() =>
                              mark(sub.id, "cancelled")
                            }
                            color="var(--muted-foreground)"
                            icon={<Minus size={16} />}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Surface>
      </div>

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

      {/* Subject breakdown — current semester only
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
      </div> */}

      

      {/* Track Attendance */}
      <div className="pt-2">
        <div className="px-1 pb-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Track Attendance
        </div>
        {/* Semester Selector */}
      {semesters.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
            {semesters.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSemesterId(s.id)}
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