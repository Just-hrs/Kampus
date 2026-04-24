import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

interface Prompt {
  q: string;
  good: string;
  bad: string;
}

const PROMPTS: Prompt[] = [
  { q: "It's 3am. Tomorrow's the exam.", good: "Sleep", bad: "Doomscroll" },
  { q: "Crush sent 'k'", good: "Ignore", bad: "Spiral" },
  { q: "Last lecture before exam", good: "Attend", bad: "Bunk" },
  { q: "₹500 left for the month", good: "Save", bad: "Zomato" },
  { q: "Group project deadline tonight", good: "Submit", bad: "Nap" },
  { q: "Professor asks a question", good: "Answer", bad: "Hide" },
  { q: "Mom calls", good: "Pick up", bad: "Decline" },
  { q: "Open Instagram", good: "Close", bad: "2 hour scroll" },
  { q: "Library has WiFi", good: "Study", bad: "Stream" },
  { q: "Hostel mess food", good: "Eat", bad: "Skip" },
  { q: "Friend says 'one more episode'", good: "No", bad: "Yes" },
  { q: "Surprise quiz announced", good: "Revise", bad: "Cry" },
];

export function BrainRotRoulette({ highScore, onDone }: { highScore: number; onDone: (s: number) => void }) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [time, setTime] = useState(30);
  const [over, setOver] = useState(false);
  const [prompt, setPrompt] = useState<Prompt>(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);
  const haptic = useHaptics();

  useEffect(() => {
    if (over) return;
    if (time <= 0) {
      setOver(true);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, over]);

  const next = useCallback(() => {
    setPrompt((p) => {
      let n = p;
      while (n === p) n = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      // randomize which side is good
      if (Math.random() > 0.5) n = { q: n.q, good: n.bad, bad: n.good };
      return n;
    });
    setFlipped((f) => !f);
  }, []);

  const choose = useCallback((side: "good" | "bad") => {
    if (side === "good") {
      haptic("success");
      const gain = 1 + Math.floor(combo / 2);
      setScore((s) => s + gain);
      setCombo((c) => c + 1);
      setFeedback("good");
    } else {
      haptic("error");
      setCombo(0);
      setScore((s) => Math.max(0, s - 2));
      setFeedback("bad");
      setTime((t) => Math.max(0, t - 2));
    }
    setTimeout(() => {
      setFeedback(null);
      next();
    }, 200);
  }, [combo, haptic, next]);

  const reset = () => {
    setScore(0);
    setCombo(0);
    setTime(30);
    setOver(false);
    setFeedback(null);
  };

  const message =
    score >= 40 ? "Brain still functions." :
    score >= 20 ? "Mid brainrot detected." :
    score >= 8 ? "Slightly fried." :
    "Skibidi level cooked.";

  return (
    <GameShell
      title="Brain Rot Roulette"
      subtitle="Pick the less unhinged option."
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="linear-gradient(135deg, #1a0033 0%, #330011 100%)"
      hud={
        <div className="flex items-center justify-between text-xs font-mono text-white">
          <div>⏱ {time}s</div>
          <div>★ {score} {combo > 1 && <span className="text-warning">×{1 + Math.floor(combo / 2)}</span>}</div>
          <div>🔥 {combo}</div>
        </div>
      }
    >
      <div className="flex h-full flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${prompt.q}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border-2 border-white/20 bg-black/40 p-6 text-center backdrop-blur w-full max-w-sm"
            style={{
              borderColor: feedback === "good" ? "#10b981" : feedback === "bad" ? "#ef4444" : "rgba(255,255,255,0.2)",
            }}
          >
            <div className="text-xs font-mono uppercase tracking-widest text-white/60">scenario</div>
            <div className="mt-2 text-xl font-bold text-white">{prompt.q}</div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 grid grid-cols-2 gap-3 w-full max-w-sm">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => choose("good")}
            className="rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 py-6 px-4 text-lg font-bold text-white shadow-lg"
          >
            {prompt.good}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => choose("bad")}
            className="rounded-2xl bg-gradient-to-br from-pink-600 to-rose-700 py-6 px-4 text-lg font-bold text-white shadow-lg"
          >
            {prompt.bad}
          </motion.button>
        </div>
        <div className="mt-6 text-[10px] font-mono uppercase text-white/40">tap fast · combos = bonus</div>
      </div>
      {over && (
        <ResultCard
          title="Brain Rot Roulette"
          emoji="🧠"
          score={score}
          best={highScore}
          message={message}
          onPlayAgain={reset}
          onQuit={() => onDone(score)}
          accent="#f59e0b"
        />
      )}
    </GameShell>
  );
}
