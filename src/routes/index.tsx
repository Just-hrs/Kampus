import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Quote, Smile, Wallet, GraduationCap, CalendarCheck, Flame, ArrowRight } from "lucide-react";
import { useStore } from "@/core/store";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Surface } from "@/core/components/Surface";
import { CountUp } from "@/core/components/CountUp";
import { RingProgress } from "@/core/components/RingProgress";
import { calcCGPA, calcSGPA } from "@/features/grades/logic";
import { subjectAttendance, overallPercentage, isoToday } from "@/features/attendance/logic";
import { monthlyTotal, necessaryUnnecessary } from "@/features/expenses/logic";
import { quoteOfDay } from "@/core/content/quotes";
import { jokeOfDay } from "@/core/content/jokes";
import { formatINR, timeOfDayGreeting } from "@/core/lib/utils";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function Dashboard() {
  const hydrated = useHydrated();
  const semesters = useStore((s) => s.semesters);
  const activeSemId = useStore((s) => s.activeSemesterId);
  const attendance = useStore((s) => s.attendance);
  const target = useStore((s) => s.settings.attendanceTarget);
  const schedule = useStore((s) => s.schedule);
  const expenses = useStore((s) => s.expenses);
  const streak = useStore((s) => s.streaks.current);
  const setActive = useStore((s) => s.setActiveSemester);

  const activeSem = semesters.find((s) => s.id === activeSemId) ?? semesters[0];
  const cgpa = calcCGPA(semesters);
  const sgpa = activeSem ? calcSGPA(activeSem) : 0;

  const allSubjects = semesters.flatMap((s) => s.subjects);
  const attRows = subjectAttendance(allSubjects, attendance, target);
  const overall = overallPercentage(attRows);

  const now = new Date();
  const monthSpend = monthlyTotal(expenses, now.getFullYear(), now.getMonth());
  const { necessary, unnecessary } = necessaryUnnecessary(expenses, now.getFullYear(), now.getMonth());

  // Today's classes
  const today = isoToday();
  const weekday = new Date(today).getDay();
  const todaySubIds = schedule[weekday] ?? [];
  const subsById = new Map(allSubjects.map((s) => [s.id, s]));
  const todayClasses = todaySubIds
    .map((id) => subsById.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-2">
      {/* HERO: CGPA + Attendance */}
      <motion.div {...fadeUp} className="grid grid-cols-2 gap-3">
        <Surface className="overflow-hidden p-4 relative">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">CGPA</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-4xl font-display font-bold text-neon">
                {hydrated ? <CountUp value={cgpa} decimals={2} /> : "0.00"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                SGPA <span className="font-mono text-foreground">{sgpa.toFixed(2)}</span>
              </div>
            </div>
            <RingProgress value={cgpa / 10} size={68} stroke={6} color="var(--primary)">
              <GraduationCap size={20} className="text-primary" />
            </RingProgress>
          </div>
        </Surface>

        <Surface className="overflow-hidden p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Attendance</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-4xl font-display font-bold">
                {hydrated ? <CountUp value={overall} decimals={0} suffix="%" /> : "0%"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                Target <span className="font-mono text-foreground">{target}%</span>
              </div>
            </div>
            <RingProgress value={overall / 100} size={68} stroke={6} color={overall >= target ? "var(--success)" : "var(--warning)"}>
              <CalendarCheck size={20} className={overall >= target ? "text-success" : "text-warning"} />
            </RingProgress>
          </div>
        </Surface>
      </motion.div>

      {/* Streak + Spend */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        <Surface className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <Flame size={12} /> Streak
          </div>
          <div className="mt-2 text-3xl font-display font-bold">
            {hydrated ? <CountUp value={streak} /> : 0}
            <span className="ml-1 text-sm font-medium text-muted-foreground">days</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {streak === 0 ? "Mark attendance to start." : "Don't break the chain."}
          </div>
        </Surface>
        <Surface className="p-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <Wallet size={12} /> This Month
          </div>
          <div className="mt-2 text-3xl font-display font-bold">{hydrated ? formatINR(monthSpend) : "₹0"}</div>
          <div className="mt-1 flex gap-2 text-[11px]">
            <span className="text-success">{formatINR(necessary)} need</span>
            <span className="text-warning">{formatINR(unnecessary)} vibe</span>
          </div>
        </Surface>
      </motion.div>

      {/* Today's classes */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Surface className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Today's Classes</div>
            <Link to="/attendance" className="text-[11px] font-semibold text-primary flex items-center gap-1">
              Mark <ArrowRight size={12} />
            </Link>
          </div>
          {todayClasses.length === 0 ? (
            <div className="rounded-[var(--radius-2)] border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nothing scheduled. Touch grass.
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {todayClasses.map((s) => (
                <div
                  key={s.id}
                  className="flex min-w-32 shrink-0 flex-col rounded-[var(--radius-2)] border border-border bg-surface-2 p-3"
                  style={{ borderLeft: `3px solid ${s.color}` }}
                >
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.credits} cr
                  </div>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </motion.div>

      {/* Quick actions */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-3">
        <Link to="/attendance">
          <Surface className="flex flex-col items-center gap-2 p-4 text-center">
            <CalendarCheck size={20} className="text-primary" />
            <div className="text-xs font-semibold">Mark</div>
          </Surface>
        </Link>
        <Link to="/grades" onClick={() => activeSem && setActive(activeSem.id)}>
          <Surface className="flex flex-col items-center gap-2 p-4 text-center">
            <GraduationCap size={20} className="text-accent" />
            <div className="text-xs font-semibold">Grades</div>
          </Surface>
        </Link>
        <Link to="/expenses">
          <Surface className="flex flex-col items-center gap-2 p-4 text-center">
            <Wallet size={20} className="text-warning" />
            <div className="text-xs font-semibold">Spend</div>
          </Surface>
        </Link>
      </motion.div>

      {/* Quote of the day */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <Surface className="p-4" variant="glass">
          <div className="flex items-start gap-3">
            <Quote size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Quote of the day
              </div>
              <div className="mt-1 text-sm font-medium leading-relaxed">{quoteOfDay()}</div>
            </div>
          </div>
        </Surface>
      </motion.div>

      {/* Joke of the day */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <Surface className="p-4">
          <div className="flex items-start gap-3">
            <Smile size={18} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Today's certified moment
              </div>
              <div className="mt-1 text-sm leading-relaxed">{jokeOfDay()}</div>
            </div>
          </div>
        </Surface>
      </motion.div>

      {/* Insight teaser */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <Link to="/insights">
          <Surface className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <div className="text-sm font-semibold">View Insights</div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Cross-feature analysis from your last 30 days.
            </div>
          </Surface>
        </Link>
      </motion.div>

      {/* Greeting subtitle */}
      <div className="pt-2 pb-4 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        {timeOfDayGreeting()} · StudentOS
      </div>
    </div>
  );
}
