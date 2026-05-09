import { useStore } from "@/core/store";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { Check, X, Minus,Plus, Rocket, ChevronLeft, ChevronRight, CalendarCog } from "lucide-react";

import { Surface } from "@/core/components/Surface";
import { useHaptics } from "@/core/hooks/useHaptics";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Signature } from "@/core/components/Signature";
import { subjectAttendance, overallPercentage, isoToday, isoFromDate, safeSkippable } from "@/features/attendance/logic";

import { Outlet } from "@tanstack/react-router";
import { isEffectiveHoliday, getHoliday } from "@/features/attendance/holidays";
import { SubjectManager } from "@/features/attendance/components/SubjectManager";
import { ExtraClassSheet } from "@/features/attendance/components/ExtraClassSheet";
import { AttendanceCalendar } from "@/features/attendance/components/AttendanceCalendar";


export const Route = createFileRoute("/attendance")({
  component: AttendancePage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AttendancePage() {
  const hydrated = useHydrated();
  const semesters = useStore((s) => s.semesters);
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
  const location = useLocation();

  const [date, setDate] = useState(() => new Date());
  const [extraClassSheetOpen, setExtraClassSheetOpen] =
    useState(false);

  const dateISO = isoFromDate(date);
  const weekday = date.getDay();

  const todayISO = isoToday();
  const isToday = dateISO === todayISO;

  const currentSemesterId = useStore(
    (s) => s.currentSemesterId,
  );

  const activeSemesterId = useStore(
    (s) => s.activeSemesterId,
  );

  const setCurrentSemester = useStore(
    (s) => s.setCurrentSemester,
  );

  // local UI state only
  const [selectedSemesterId, setSelectedSemesterId] =
    useState<string | null>(null);

  const [initialized, setInitialized] = useState(false);

  // Current semester ONLY
  const activeSem = useMemo(() => {
    const id =
      selectedSemesterId ??
      currentSemesterId ??
      activeSemesterId;

    return semesters.find((s) => s.id === id) ?? null;
  }, [
    semesters,
    selectedSemesterId,
    currentSemesterId,
    activeSemesterId,
  ]);

  const currentSubs = activeSem?.subjects ?? [];

  const subsById = useMemo(
    () =>
      new Map(
        currentSubs.map((s) => [s.id, s]),
      ),
    [currentSubs],
  );

  const sourceHoliday = getHoliday(dateISO);

  const holidayOverride =
    holidayOverrides[dateISO];

  const isHoliday = isEffectiveHoliday(
    dateISO,
    holidayOverrides,
  );

  const holidayLabel =
    sourceHoliday?.name ??
    "Rahasyamayi Avkaash";

  const manualHoliday =
    holidayOverride === "holiday";

  const forcedWorking =
    holidayOverride === "working";



  const realHoliday =
  getHoliday(dateISO);

  //const manualHoliday = holidayOverrides[dateISO] === "holiday";

  const todayExtras = extraClasses
    .filter((x) => x.dateISO === dateISO)
    .map((x) => subsById.get(x.subjectId))
    .filter(Boolean) as typeof currentSubs;

  const scheduledSubs =
    ((schedule[weekday] ?? [])
      .map((id) => subsById.get(id))
      .filter(Boolean) as typeof currentSubs);

  const todaySubs = isHoliday
  ? todayExtras
  : [...scheduledSubs, ...todayExtras];

  

  const allAbsent =
    todaySubs.length > 0 &&
    todaySubs.every(
      (sub) =>
        attendance[`${dateISO}_${sub.id}`] ===
        "absent",
    );

  const rows = useMemo(
    () =>
      subjectAttendance(
        currentSubs,
        attendance,
        target,
      ),
    [currentSubs, attendance, target],
  );

  const overall = overallPercentage(rows);

  const calendarSemId = activeSem?.id ?? "";

  const mark = (
    subId: string,
    status: "present" | "absent" | "cancelled",
  ) => {
    const key = `${dateISO}_${subId}`;

    const cur = attendance[key];

    setAtt(
      dateISO,
      subId,
      cur === status ? null : status,
    );

    haptic(
      status === "present"
        ? "success"
        : status === "absent"
          ? "warning"
          : "tick",
    );

    if (isToday && status === "present") {
      bumpStreak();
    }
  };

  const shiftDay = (delta: number) => {
    const d = new Date(date);

    d.setDate(d.getDate() + delta);

    setDate(d);

    haptic("tick");
  };

  useEffect(() => {
    if (!initialized) {
      setSelectedSemesterId(
        currentSemesterId ??
          activeSemesterId,
      );

      setInitialized(true);
    }
  }, [ initialized, currentSemesterId, activeSemesterId]);

  useEffect(() => {
    setExtraClassSheetOpen(false);
  }, [dateISO]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-2">

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
            
            {(
              <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">

                {/* CHHUTTI */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => {
                    if (sourceHoliday) {
                      setHolidayOverride(
                        dateISO,
                        forcedWorking ? null : "working",
                      );
                    } else {
                      setHolidayOverride(
                        dateISO,
                        manualHoliday ? null : "holiday",
                      );
                    }

                    haptic("soft");
                  }}
                  className={`group relative overflow-hidden rounded-3xl border px-4 py-3 transition-all ${
                    isHoliday
                      ? "border-primary/40 bg-primary text-primary-foreground"
                      : "border-border/50 bg-surface-2/70"
                  }`}
                >
                  <div className="relative flex items-center gap-2">
                    <div className="text-lg">
                      😴
                    </div>

                    <div className="text-left leading-none">
                      <div className="text-[11px] font-black uppercase tracking-wider">
                        Chhutti
                      </div>

                      <div className={`mt-1 text-[10px] ${
                        isHoliday
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}>
                        Emergency freedom
                      </div>
                    </div>
                  </div>

                  {isHoliday && (
                    <div className="pointer-events-none absolute inset-0 opacity-30">
                      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/30 blur-2xl" />
                    </div>
                  )}
                </motion.button>

                {/* BUNK ALL */}
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  disabled={isHoliday || todaySubs.length === 0}
                  onClick={() => {
                    const next = !allAbsent;

                    todaySubs.forEach((sub) => {
                      setAtt(
                        dateISO,
                        sub.id,
                        next ? "absent" : null,
                      );
                    });

                    haptic(next ? "error" : "soft");
                  }}
                  className={`relative overflow-hidden rounded-3xl border px-4 py-3 transition-all ${
                    allAbsent
                      ? "border-destructive/40 bg-destructive text-white"
                      : "border-border/50 bg-surface-2/70"
                  } ${isHoliday ? "opacity-40" : ""}`}
                >
                  <div className="relative flex items-center gap-2">
                    <div className="text-lg">
                      💀
                    </div>

                    <div className="text-left leading-none">
                      <div className="text-[11px] font-black uppercase tracking-wider">
                        Bunk All
                      </div>

                      <div className={`mt-1 text-[10px] ${
                        allAbsent
                          ? "text-white/80"
                          : "text-muted-foreground"
                      }`}>
                        Self destruction
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>
            )}

            {/* Holiday */}
            {isHoliday && todayExtras.length === 0 && !extraClassSheetOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 overflow-hidden rounded-[32px] border border-border/40 bg-surface-2/70"
              >
                <div className="relative p-5">

                  {/* theme aware glow */}
                  <div className="pointer-events-none absolute inset-0 opacity-40">
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary blur-3xl" />
                  </div>

                  <div className="relative flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-background text-4xl shadow-sm">
                      😴
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
                        {holidayLabel}
                      </div>

                      <div className="mt-2 text-3xl font-black tracking-tight leading-none">
                        Chhutti hai bhai
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Productivity has been temporarily discontinued.
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setExtraClassSheetOpen(true);
                          haptic("warning");
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-background px-4 py-3 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                      >
                        😭 But wait... classes hain?
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            <ExtraClassSheet
              open={extraClassSheetOpen}
              onClose={() => setExtraClassSheetOpen(false)}
              dateISO={dateISO}
              subjects={currentSubs}
            />

            {/* Subject List */}
            <div className="mt-5 space-y-2">
              {todaySubs.length === 0 && !isHoliday ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="overflow-hidden rounded-[32px] border border-border/40 bg-surface-2/60"
                >
                  <div className="relative p-6 text-center">

                    <div className="pointer-events-none absolute inset-0 opacity-20">
                      <div className="absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-accent blur-3xl" />
                    </div>

                    <div className="relative">
                      <div className="text-6xl">
                        😴
                      </div>

                      <div className="mt-4 text-2xl font-black tracking-tight">
                        No classes scheduled
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        Either enjoy life responsibly or destroy it manually.
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => {
                          setExtraClassSheetOpen(true);
                          haptic("warning");
                        }}
                        className="mt-6 inline-flex items-center gap-2 rounded-3xl border border-border/40 bg-background px-5 py-4 text-sm font-black transition-all"
                      >
                        <Plus size={16} />
                        😭 Add Extra Class
                      </motion.button>

                      <div className="mt-5 text-[11px] text-muted-foreground">
                        Need permanent schedule?{" "}
                        <Link
                          to="/attendance/timetable"
                          className="font-semibold text-primary"
                        >
                          Edit Timetable
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
              <>
                {todaySubs.map((sub) => {
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
                })}

                {/* Extra Class */}
                {!isHoliday && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick= {() => {
                    setExtraClassSheetOpen(true);
                    haptic("warning")
                  }}
                  className="flex w-full items-center justify-between rounded-3xl border border-dashed border-border/50 bg-surface-2/40 p-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-xl">
                      😭
                    </div>

                    <div className="text-left">
                      <div className="text-sm font-black tracking-tight">
                        Add Extra Class
                      </div>

                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Because suffering scales horizontally.
                      </div>
                    </div>
                  </div>

                  <Plus size={18} className="text-muted-foreground" />
                </motion.button>
                )}
              </>
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
                onClick={() => {
                  setSelectedSemesterId(s.id);
                }}
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

function StatusBtn({ active, onClick, color, icon }: { active: boolean; onClick: () => void; color: string; icon: React.ReactNode }) {
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
