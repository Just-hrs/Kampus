import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

interface Stats {
  sleep: number;
  attendance: number;
  sanity: number;
  grades: number;
}

interface Choice {
  label: string;
  delta: Partial<Stats>;
  outcome: string;
}

interface Scenario {
  prompt: string;
  emoji: string;
  choices: [Choice, Choice];
}

const SCENARIOS: Scenario[] = [
  {
    prompt: "Alarm at 7am. First class.", emoji: "⏰",
    choices: [
      { label: "Get up", delta: { sleep: -10, attendance: 15 }, outcome: "Punctual king/queen." },
      { label: "Snooze", delta: { sleep: 5, attendance: -10 }, outcome: "Cozy regret." },
    ],
  },
  {
    prompt: "Open laptop to study. TikTok tab open.", emoji: "📱",
    choices: [
      { label: "Close it", delta: { grades: 10, sanity: -5 }, outcome: "Discipline acquired." },
      { label: "5 mins only", delta: { grades: -10, sanity: 8 }, outcome: "It was 4 hours." },
    ],
  },
  {
    prompt: "Crush invites you to a party. Exam tomorrow.", emoji: "💃",
    choices: [
      { label: "Study", delta: { grades: 15, sanity: -15 }, outcome: "FOMO tier 9." },
      { label: "Go", delta: { grades: -15, sanity: 20, sleep: -15 }, outcome: "Memories > marks." },
    ],
  },
  {
    prompt: "Mess food smells weird.", emoji: "🍛",
    choices: [
      { label: "Eat it", delta: { sanity: -8, sleep: -5 }, outcome: "Bathroom emergency." },
      { label: "Skip", delta: { sanity: 2, grades: -3 }, outcome: "Hangry mode." },
    ],
  },
  {
    prompt: "Group project. You're carrying everyone.", emoji: "👥",
    choices: [
      { label: "Carry them", delta: { grades: 10, sanity: -15 }, outcome: "B+ for them. A for you." },
      { label: "Half-ass it", delta: { grades: -8, sanity: 5 }, outcome: "Fair distribution of L's." },
    ],
  },
  {
    prompt: "Coffee or actual sleep tonight?", emoji: "☕",
    choices: [
      { label: "Coffee", delta: { sleep: -15, grades: 8, sanity: -5 }, outcome: "Heart racing at 3am." },
      { label: "Sleep", delta: { sleep: 20, grades: -5 }, outcome: "Brain works tomorrow." },
    ],
  },
  {
    prompt: "Professor asks for volunteers.", emoji: "🙋",
    choices: [
      { label: "Volunteer", delta: { grades: 12, sanity: -8 }, outcome: "Bonus marks unlocked." },
      { label: "Look down", delta: { grades: -2, sanity: 3 }, outcome: "Survival mode." },
    ],
  },
  {
    prompt: "Bunk last class for biryani?", emoji: "🍗",
    choices: [
      { label: "Yes biryani", delta: { attendance: -10, sanity: 12 }, outcome: "Worth every grain." },
      { label: "Stay", delta: { attendance: 8, sanity: -3 }, outcome: "Discipline tax paid." },
    ],
  },
];

const START: Stats = { sleep: 60, attendance: 70, sanity: 70, grades: 60 };

export function CollegeSim({ highScore, onDone }: { highScore: number; onDone: (s: number) => void }) {
  const [stats, setStats] = useState<Stats>(START);
  const [day, setDay] = useState(1);
  const [scenario, setScenario] = useState<Scenario>(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const haptic = useHaptics();

  const score = Math.round((stats.sleep + stats.attendance + stats.sanity + stats.grades) / 4);

  const apply = useCallback((c: Choice) => {
    haptic("tick");
    setStats((s) => {
      const next = { ...s };
      for (const k of Object.keys(c.delta) as (keyof Stats)[]) {
        next[k] = Math.max(0, Math.min(100, s[k] + (c.delta[k] ?? 0)));
      }
      return next;
    });
    setOutcome(c.outcome);
  }, [haptic]);

  const nextDay = useCallback(() => {
    if (day >= 10 || stats.sanity <= 0 || stats.attendance <= 0) {
      setOver(true);
      return;
    }
    setDay((d) => d + 1);
    setOutcome(null);
    setScenario((p) => {
      let n = p;
      while (n === p) n = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      return n;
    });
  }, [day, stats]);

  const reset = () => {
    setStats(START);
    setDay(1);
    setOutcome(null);
    setOver(false);
    setScenario(SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  };

  const ending =
    stats.sanity <= 0 ? "Mental breakdown. Took a semester off." :
    stats.attendance <= 0 ? "Detained. Welcome back next year." :
    score >= 75 ? "Honor roll. Built different." :
    score >= 55 ? "Survived. Mid arc." :
    "Barely passed. Character development incoming.";

  return (
    <GameShell
      title="College Sim"
      subtitle={`Day ${day}/10`}
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)"
      hud={
        <div className="grid grid-cols-4 gap-2 text-[10px] text-white">
          <StatBar label="😴" value={stats.sleep} color="#3b82f6" />
          <StatBar label="📚" value={stats.attendance} color="#10b981" />
          <StatBar label="🧠" value={stats.sanity} color="#f59e0b" />
          <StatBar label="📊" value={stats.grades} color="#ec4899" />
        </div>
      }
    >
      <div className="flex h-full flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!outcome ? (
            <motion.div
              key={scenario.prompt}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-sm"
            >
              <div className="text-6xl text-center mb-4">{scenario.emoji}</div>
              <div className="rounded-2xl bg-white/10 backdrop-blur p-4 text-center">
                <div className="text-xs font-mono text-white/50">DAY {day}</div>
                <div className="mt-1 text-lg font-bold text-white">{scenario.prompt}</div>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3">
                {scenario.choices.map((c, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => apply(c)}
                    className="rounded-xl border border-white/20 bg-white/5 p-4 text-left text-white active:bg-white/10"
                  >
                    <div className="text-base font-bold">{c.label}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="outcome"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm text-center"
            >
              <div className="text-5xl mb-3">{scenario.emoji}</div>
              <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
                <div className="text-xs font-mono text-white/50 uppercase tracking-widest">outcome</div>
                <div className="mt-2 text-base font-bold text-white">{outcome}</div>
              </div>
              <button
                onClick={nextDay}
                className="mt-6 w-full rounded-full bg-white py-3 text-sm font-bold text-black"
              >
                {day >= 10 ? "See Ending" : "Next Day →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {over && (
        <ResultCard
          title="College Sim"
          emoji="🎓"
          score={score}
          best={highScore}
          message={ending}
          onPlayAgain={reset}
          onQuit={() => onDone(score)}
          accent="#a855f7"
        />
      )}
    </GameShell>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-[9px]">{value}</span>
      </div>
      <div className="mt-0.5 h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
