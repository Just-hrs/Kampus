import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

type Phase = "wait" | "ready" | "go" | "tooSoon" | "result";

export function ReflexLab({ highScore, onDone }: { highScore: number; onDone: (s: number) => void }) {
  const [phase, setPhase] = useState<Phase>("wait");
  const [round, setRound] = useState(1);
  const [reactions, setReactions] = useState<number[]>([]);
  const [over, setOver] = useState(false);
  const [score, setScore] = useState(0);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const haptic = useHaptics();

  const startRound = useCallback(() => {
    setPhase("ready");
    const delay = 800 + Math.random() * 2200;
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now();
      setPhase("go");
      haptic("heavy");
    }, delay);
  }, [haptic]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  useEffect(() => {
    if (round > 5 && !over) {
      const total = reactions.reduce((s, r) => s + r, 0);
      const avg = reactions.length ? total / reactions.length : 0;
      // score: lower avg = higher score, max ~ 1000
      const computed = Math.max(0, Math.round(1000 - avg));
      setScore(computed);
      setOver(true);
    }
  }, [round, over, reactions]);

  const onTap = () => {
    if (phase === "wait") {
      startRound();
    } else if (phase === "ready") {
      // tapped too early
      if (timerRef.current) clearTimeout(timerRef.current);
      haptic("error");
      setPhase("tooSoon");
    } else if (phase === "go") {
      const r = performance.now() - startRef.current;
      haptic("success");
      setReactions((arr) => [...arr, r]);
      setRound((x) => x + 1);
      setPhase("result");
    } else if (phase === "tooSoon") {
      setReactions((arr) => [...arr, 800]); // penalty
      setRound((x) => x + 1);
      setPhase("result");
    } else if (phase === "result") {
      setPhase("wait");
    }
  };

  const reset = () => {
    setRound(1);
    setReactions([]);
    setOver(false);
    setScore(0);
    setPhase("wait");
  };

  const lastReact = reactions[reactions.length - 1];
  const avgReact = reactions.length ? reactions.reduce((s, r) => s + r, 0) / reactions.length : 0;

  const bg =
    phase === "go" ? "#10b981" :
    phase === "ready" ? "#ef4444" :
    phase === "tooSoon" ? "#f59e0b" :
    "#0a0a0f";

  const label =
    phase === "wait" ? "TAP TO START" :
    phase === "ready" ? "WAIT..." :
    phase === "go" ? "TAP NOW" :
    phase === "tooSoon" ? "TOO EARLY!" :
    `${Math.round(lastReact ?? 0)}ms`;

  const sub =
    phase === "wait" ? `Round ${round}/5` :
    phase === "ready" ? "Don't tap yet" :
    phase === "go" ? "GO GO GO" :
    phase === "tooSoon" ? "Tap to continue" :
    "Tap to next round";

  const message =
    score >= 800 ? "Pro gamer reflexes." :
    score >= 600 ? "Sharp." :
    score >= 400 ? "Average human." :
    "Have you slept?";

  return (
    <GameShell
      title="Reflex Lab"
      subtitle="React when screen turns green."
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="#050507"
      hud={
        <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
          <div>ROUND {Math.min(round, 5)}/5</div>
          <div>LAST {lastReact ? `${Math.round(lastReact)}ms` : "—"}</div>
          <div>AVG {avgReact ? `${Math.round(avgReact)}ms` : "—"}</div>
        </div>
      }
    >
      <button onClick={onTap} className="absolute inset-0 flex flex-col items-center justify-center transition-colors duration-150" style={{ background: bg }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + round}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="font-display text-5xl font-bold text-white">{label}</div>
            <div className="mt-2 text-xs font-mono uppercase tracking-widest text-white/70">{sub}</div>
          </motion.div>
        </AnimatePresence>
        {/* Lab grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
      </button>
      {over && (
        <ResultCard
          title="Reflex Lab"
          emoji="⚡"
          score={score}
          best={highScore}
          message={message}
          onPlayAgain={reset}
          onQuit={() => onDone(score)}
          accent="#06b6d4"
        />
      )}
    </GameShell>
  );
}
