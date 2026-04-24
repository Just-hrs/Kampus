import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, X, Check } from "lucide-react";
import { useStore, type ThemeId, type DaySchedule } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const STEPS = ["welcome", "name", "theme", "subjects", "schedule", "target", "done"] as const;
type Step = (typeof STEPS)[number];

const THEMES: Array<{ id: ThemeId; name: string; vibe: string; preview: string }> = [
  { id: "neon", name: "Midnight Neon", vibe: "Cyberpunk", preview: "linear-gradient(135deg, oklch(0.72 0.22 305), oklch(0.78 0.18 195))" },
  { id: "matte", name: "Matte OS", vibe: "Premium calm", preview: "linear-gradient(135deg, oklch(0.7 0.08 250), oklch(0.6 0.06 250))" },
  { id: "pop", name: "Bold Pop", vibe: "Gen-Z energy", preview: "linear-gradient(135deg, oklch(0.65 0.26 25), oklch(0.85 0.2 90))" },
  { id: "focus", name: "Minimal Focus", vibe: "Monk mode", preview: "linear-gradient(135deg, oklch(0.2 0.01 90), oklch(0.5 0.05 230))" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Onboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const setTheme = useStore((s) => s.setTheme);
  const haptic = useHaptics();

  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState("");
  const [theme, setTh] = useState<ThemeId>("neon");
  const [subjects, setSubjects] = useState<Array<{ name: string; credits: number }>>([]);
  const [newSub, setNewSub] = useState("");
  const [newCr, setNewCr] = useState(3);
  const [schedule, setSchedule] = useState<DaySchedule>({});
  const [target, setTarget] = useState(75);
  const [totalSems, setTotalSems] = useState(8);

  const idx = STEPS.indexOf(step);
  const progress = (idx / (STEPS.length - 1)) * 100;

  const next = () => {
    haptic("success");
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };

  const finish = () => {
    completeOnboarding({
      name,
      theme,
      totalSemesters: totalSems,
      target,
      subjects,
      schedule: Object.fromEntries(
        Object.entries(schedule).map(([day, names]) => [day, names as string[]]),
      ),
    });
    haptic("success");
    void navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-svh flex flex-col bg-background">
      <div className="aurora-bg" />
      <div className="relative z-10 flex flex-col flex-1">
        {/* Progress */}
        <div className="px-4 pt-4">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full"
              animate={{ width: `${progress}%` }}
              style={{ background: "var(--grad-primary)" }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="mx-auto w-full max-w-md"
            >
              {step === "welcome" && (
                <div className="text-center pt-8">
                  <div className="text-6xl mb-4">🎓</div>
                  <h1 className="text-3xl font-display font-bold text-neon">StudentOS</h1>
                  <p className="mt-3 text-muted-foreground">
                    Your offline college companion. Grades, attendance, expenses, bunk plans, and chaos. All on your device.
                  </p>
                </div>
              )}

              {step === "name" && (
                <div>
                  <h2 className="text-2xl font-display font-bold">What should we call you?</h2>
                  <p className="text-muted-foreground mt-1 text-sm">First name works.</p>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="mt-6 w-full rounded-[var(--radius-2)] surface-glass px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {step === "theme" && (
                <div>
                  <h2 className="text-2xl font-display font-bold">Pick your vibe</h2>
                  <p className="text-muted-foreground mt-1 text-sm">You can change this anytime.</p>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {THEMES.map((t) => {
                      const active = theme === t.id;
                      return (
                        <motion.button
                          key={t.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            setTh(t.id);
                            setTheme(t.id);
                            haptic("tick");
                          }}
                          className="relative overflow-hidden rounded-[var(--radius-2)] p-4 text-left border-2 min-h-24"
                          style={{
                            background: t.preview,
                            borderColor: active ? "var(--ring)" : "transparent",
                          }}
                        >
                          <div className="text-sm font-bold text-white">{t.name}</div>
                          <div className="text-[10px] text-white/80">{t.vibe}</div>
                          {active && (
                            <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                              <Check size={12} />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === "subjects" && (
                <div>
                  <h2 className="text-2xl font-display font-bold">Add your subjects</h2>
                  <p className="text-muted-foreground mt-1 text-sm">For your current semester.</p>
                  <div className="mt-4 flex gap-2">
                    <input
                      value={newSub}
                      onChange={(e) => setNewSub(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSub.trim()) {
                          setSubjects([...subjects, { name: newSub.trim(), credits: newCr }]);
                          setNewSub("");
                          haptic("success");
                        }
                      }}
                      placeholder="Subject name"
                      className="flex-1 rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
                      <button onClick={() => setNewCr(Math.max(1, newCr - 1))} className="h-9 w-7 text-muted-foreground">−</button>
                      <span className="w-6 text-center font-mono text-sm">{newCr}</span>
                      <button onClick={() => setNewCr(Math.min(8, newCr + 1))} className="h-9 w-7 text-muted-foreground">+</button>
                    </div>
                    <button
                      onClick={() => {
                        if (!newSub.trim()) return;
                        setSubjects([...subjects, { name: newSub.trim(), credits: newCr }]);
                        setNewSub("");
                        haptic("success");
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {subjects.map((s, i) => (
                      <div key={i} className="surface-glass flex items-center justify-between rounded-[var(--radius-2)] px-3 py-2">
                        <div>
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-[10px] text-muted-foreground">{s.credits} credits</div>
                        </div>
                        <button
                          onClick={() => setSubjects(subjects.filter((_, j) => j !== i))}
                          className="text-muted-foreground"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {subjects.length === 0 && (
                      <div className="rounded-[var(--radius-2)] border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                        Add at least one subject.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === "schedule" && (
                <div>
                  <h2 className="text-2xl font-display font-bold">Weekly timetable</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Tap subjects to add to each day.</p>
                  <div className="mt-4 space-y-2">
                    {DAY_NAMES.map((d, di) => (
                      <div key={di} className="surface-glass rounded-[var(--radius-2)] p-3">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                          {d}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {subjects.map((s) => {
                            const day = (schedule[di] as string[] | undefined) ?? [];
                            const on = day.includes(s.name);
                            return (
                              <button
                                key={s.name}
                                onClick={() => {
                                  setSchedule((sc) => {
                                    const cur = (sc[di] as string[] | undefined) ?? [];
                                    return { ...sc, [di]: on ? cur.filter((x) => x !== s.name) : [...cur, s.name] };
                                  });
                                  haptic("tick");
                                }}
                                className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                                style={{
                                  background: on ? "var(--primary)" : "var(--surface-2)",
                                  color: on ? "var(--primary-foreground)" : "var(--muted-foreground)",
                                }}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                          {subjects.length === 0 && (
                            <div className="text-xs text-muted-foreground">Add subjects first.</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === "target" && (
                <div>
                  <h2 className="text-2xl font-display font-bold">Set your bar</h2>
                  <p className="text-muted-foreground mt-1 text-sm">You can adjust these later.</p>
                  <div className="mt-6 surface-glass rounded-[var(--radius-2)] p-4">
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Attendance target
                    </div>
                    <div className="text-4xl font-display font-bold text-neon mt-1">{target}%</div>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={target}
                      onChange={(e) => setTarget(Number(e.target.value))}
                      className="mt-2 w-full accent-[color:var(--primary)]"
                    />
                  </div>
                  <div className="mt-3 surface-glass rounded-[var(--radius-2)] p-4">
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Total semesters
                    </div>
                    <div className="text-4xl font-display font-bold mt-1">{totalSems}</div>
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={totalSems}
                      onChange={(e) => setTotalSems(Number(e.target.value))}
                      className="mt-2 w-full accent-[color:var(--primary)]"
                    />
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="text-center pt-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="text-7xl mb-4"
                  >
                    🚀
                  </motion.div>
                  <h2 className="text-2xl font-display font-bold">All set, {name || "friend"}.</h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Your StudentOS is calibrated. Let's run it.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-background to-transparent">
          <button
            onClick={step === "done" ? finish : next}
            disabled={step === "subjects" && subjects.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
            style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
          >
            {step === "done" ? "Launch StudentOS" : "Continue"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
