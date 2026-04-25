import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Heart, Sparkles, RefreshCw } from "lucide-react";
import { useStore, type Subject } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";
import {
  buildFutureDays,
  tallyFromAttendance,
  averagePercent,
  projectPlan,
  strategyMaxBunk,
  strategyClearDay,
  strategyHated,
  type PlannerMode,
  type PlanDecision,
} from "@/features/attendance/planner";

const MODE_META: Array<{ id: PlannerMode; label: string; icon: React.ReactNode; tag: string }> = [
  { id: "max-bunk", label: "Max Bunk", icon: <Zap size={14} />, tag: "Auto-skip safely" },
  { id: "clear-day", label: "Clear Day", icon: <Sparkles size={14} />, tag: "Free full days" },
  { id: "hated", label: "Hated Sub", icon: <Heart size={14} />, tag: "Skip what you hate" },
  { id: "manual", label: "Manual", icon: <Shield size={14} />, tag: "You decide" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function BunkPlanner() {
  const haptic = useHaptics();
  const semesters = useStore((s) => s.semesters);
  const activeSemId = useStore((s) => s.activeSemesterId);
  const schedule = useStore((s) => s.schedule);
  const attendance = useStore((s) => s.attendance);
  const extraClasses = useStore((s) => s.extraClasses);
  const holidayOverrides = useStore((s) => s.holidayOverrides);
  const target = useStore((s) => s.settings.attendanceTarget);

  const sem = semesters.find((s) => s.id === activeSemId) ?? semesters[semesters.length - 1];
  const subjects = sem?.subjects ?? [];

  const [mode, setMode] = useState<PlannerMode>("max-bunk");
  const [horizon, setHorizon] = useState(14);
  const [planTarget, setPlanTarget] = useState(target);
  const [hated, setHated] = useState<Set<string>>(new Set());
  const [decisions, setDecisions] = useState<Record<string, PlanDecision>>({});

  // Build days from tomorrow onward
  const days = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    return buildFutureDays(start, horizon, schedule, subjects, extraClasses, holidayOverrides);
  }, [horizon, schedule, subjects, extraClasses, holidayOverrides]);

  const baseTally = useMemo(() => tallyFromAttendance(subjects, attendance), [subjects, attendance]);
  const baseAvg = useMemo(() => averagePercent(baseTally), [baseTally]);

  // Auto-generate plan when mode/horizon/target/hated changes
  useEffect(() => {
    if (mode === "manual") return;
    let next: Record<string, PlanDecision> = {};
    if (mode === "max-bunk") next = strategyMaxBunk(baseTally, days, planTarget);
    else if (mode === "clear-day") next = strategyClearDay(baseTally, days, planTarget);
    else if (mode === "hated") next = strategyHated(baseTally, days, planTarget, hated);
    setDecisions(next);
  }, [mode, days, planTarget, hated, baseTally]);

  const projected = useMemo(() => projectPlan(baseTally, days, decisions), [baseTally, days, decisions]);
  const projectedAvg = useMemo(() => averagePercent(projected), [projected]);

  const subById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const toggleDecision = (key: string, current: PlanDecision) => {
    setDecisions((d) => ({ ...d, [key]: current === "go" ? "skip" : "go" }));
    haptic("tick");
  };

  const toggleHated = (id: string) => {
    setHated((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    haptic("tick");
  };

  const resetPlan = () => {
    setDecisions({});
    haptic("warning");
  };

  if (!sem || subjects.length === 0) {
    return (
      <Surface className="p-6 text-center">
        <div className="text-3xl mb-2">📚</div>
        <div className="text-sm font-bold">Add subjects first</div>
        <div className="text-xs text-muted-foreground mt-1">Set up your timetable to plan bunks.</div>
      </Surface>
    );
  }

  return (
    <div className="space-y-3 pb-32">
      {/* Mode selector */}
      <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="Planner mode">
        {MODE_META.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              haptic("tick");
            }}
            aria-pressed={mode === m.id}
            className="flex flex-col items-center gap-1 rounded-[var(--radius-2)] py-2.5 text-[10px] font-bold transition-all"
            style={{
              background: mode === m.id ? "var(--primary)" : "var(--surface-2)",
              color: mode === m.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>
      <div className="text-center text-[11px] text-muted-foreground -mt-1">
        {MODE_META.find((m) => m.id === mode)?.tag}
      </div>

      {/* Controls */}
      <Surface className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="horizon" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Plan next</label>
            <span className="font-display text-sm font-bold">{horizon} days</span>
          </div>
          <input id="horizon" type="range" min="3" max="60" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="w-full accent-[color:var(--primary)]" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="ptarget" className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Target after plan</label>
            <span className="font-display text-sm font-bold text-neon">{planTarget}%</span>
          </div>
          <input id="ptarget" type="range" min="50" max="95" value={planTarget} onChange={(e) => setPlanTarget(Number(e.target.value))} className="w-full accent-[color:var(--primary)]" />
        </div>
        {mode === "hated" && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5">Subjects to bunk</div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {subjects.map((s) => {
                const on = hated.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleHated(s.id)}
                    aria-pressed={on}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                    style={{ background: on ? s.color : "var(--surface-2)", color: on ? "white" : "var(--muted-foreground)" }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: on ? "white" : s.color }} />
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {mode === "manual" && (
          <button onClick={resetPlan} className="flex items-center justify-center gap-1.5 w-full rounded-full surface-glass py-2 text-xs font-semibold">
            <RefreshCw size={12} /> Reset all to "Go"
          </button>
        )}
      </Surface>

      {/* Per-subject impact */}
      <Surface className="p-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Per-subject after plan</div>
        <div className="space-y-1.5">
          {subjects.map((s) => {
            const b = projected.get(s.id) ?? { p: 0, t: 0 };
            const pct = b.t === 0 ? 100 : (b.p / b.t) * 100;
            const baseB = baseTally.get(s.id) ?? { p: 0, t: 0 };
            const basePct = baseB.t === 0 ? 100 : (baseB.p / baseB.t) * 100;
            const diff = pct - basePct;
            const safe = pct >= planTarget;
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-2)] bg-surface-2 p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="truncate text-xs font-semibold">{s.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-display text-sm font-bold" style={{ color: safe ? "var(--success)" : "var(--destructive)" }}>
                    {pct.toFixed(0)}%
                  </span>
                  <span className={`ml-1.5 text-[10px] ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>

      {/* Day-wise plan */}
      <div className="space-y-2">
        <div className="px-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Day-wise plan</div>
        {days.map((day) => (
          <DayPlanCard
            key={day.dateISO}
            day={day}
            subById={subById}
            decisions={decisions}
            onToggle={toggleDecision}
          />
        ))}
      </div>

      <FloatingProjection baseAvg={baseAvg} projAvg={projectedAvg} target={planTarget} />
    </div>
  );
}

function DayPlanCard({
  day,
  subById,
  decisions,
  onToggle,
}: {
  day: ReturnType<typeof buildFutureDays>[number];
  subById: Map<string, Subject>;
  decisions: Record<string, PlanDecision>;
  onToggle: (key: string, cur: PlanDecision) => void;
}) {
  const dt = new Date(day.dateISO);
  const label = `${DAY_NAMES[day.weekday]} ${dt.getDate()}/${dt.getMonth() + 1}`;
  if (day.holiday) {
    return (
      <Surface className="p-3 flex items-center gap-3" variant="glass">
        <div className="text-2xl" aria-hidden="true">😴</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-sm font-bold">Chhutti hai so ja — {day.holiday}</div>
        </div>
      </Surface>
    );
  }
  if (day.slots.length === 0) {
    return (
      <Surface className="p-3 flex items-center gap-3 opacity-70">
        <div className="text-xl" aria-hidden="true">🌤️</div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="text-xs">No classes scheduled</div>
        </div>
      </Surface>
    );
  }
  return (
    <Surface className="p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1.5">
        {day.slots.map((slot, i) => {
          const sub = subById.get(slot.subjectId);
          if (!sub) return null;
          const key = `${slot.dateISO}_${slot.subjectId}_${i}`;
          const dec = decisions[key] ?? slot.decision;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sub.color }} />
              <span className="flex-1 truncate text-sm font-semibold">
                {sub.name}
                {slot.extra && <span className="ml-1.5 text-[10px] text-warning">extra</span>}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => dec === "skip" && onToggle(key, dec)}
                  aria-pressed={dec === "go"}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
                  style={{
                    background: dec === "go" ? "var(--success)" : "var(--surface-2)",
                    color: dec === "go" ? "white" : "var(--muted-foreground)",
                  }}
                >
                  Jaunga
                </button>
                <button
                  onClick={() => dec === "go" && onToggle(key, dec)}
                  aria-pressed={dec === "skip"}
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold transition-all"
                  style={{
                    background: dec === "skip" ? "var(--destructive)" : "var(--surface-2)",
                    color: dec === "skip" ? "white" : "var(--muted-foreground)",
                  }}
                >
                  Nhi Jaunga
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
}

function FloatingProjection({ baseAvg, projAvg, target }: { baseAvg: number; projAvg: number; target: number }) {
  const safe = projAvg >= target;
  const ref = useRef<HTMLDivElement>(null);
  // Animate value smoothly
  const [shown, setShown] = useState(projAvg);
  useEffect(() => {
    let raf = 0;
    const start = shown;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 240);
      setShown(start + (projAvg - start) * k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projAvg]);

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-30 px-3 pointer-events-none"
      >
        <div
          className="mx-auto max-w-md rounded-full surface-glass px-4 py-2.5 backdrop-blur-sm pointer-events-auto"
          style={{
            border: `1px solid ${safe ? "color-mix(in oklab, var(--success) 50%, transparent)" : "color-mix(in oklab, var(--destructive) 50%, transparent)"}`,
            boxShadow: safe ? "0 0 24px color-mix(in oklab, var(--success) 35%, transparent)" : "0 0 24px color-mix(in oklab, var(--destructive) 35%, transparent)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Projected</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] text-muted-foreground">{baseAvg.toFixed(0)}%</span>
              <span className="text-[10px]" aria-hidden="true">→</span>
              <span className="font-display text-2xl font-bold tabular-nums" style={{ color: safe ? "var(--success)" : "var(--destructive)" }}>
                {shown.toFixed(0)}%
              </span>
              <span className="text-[10px] text-muted-foreground">/ {target}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
