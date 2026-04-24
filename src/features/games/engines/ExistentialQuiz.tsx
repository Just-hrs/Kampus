import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

interface Q {
  q: string;
  a: [string, string, string, string];
  // each option leans toward an "ending" archetype
  axis: [number, number, number, number];
}

const QUESTIONS: Q[] = [
  { q: "Why are you in college?", a: ["Parents", "Job", "Vibes", "Idk"], axis: [1, 2, 3, 4] },
  { q: "Your 3am thought:", a: ["Career", "Crush", "Snacks", "Existence"], axis: [2, 3, 1, 4] },
  { q: "Pick a vibe:", a: ["Hustle", "Chill", "Chaos", "Doom"], axis: [2, 1, 3, 4] },
  { q: "Favorite excuse:", a: ["Was sick", "Family thing", "WiFi died", "Idc anymore"], axis: [1, 2, 3, 4] },
  { q: "If college was a Netflix show:", a: ["Drama", "Sitcom", "Horror", "Documentary"], axis: [3, 1, 4, 2] },
  { q: "Your spirit beverage:", a: ["Coffee", "Energy drink", "Maggi water", "Tears"], axis: [2, 3, 1, 4] },
  { q: "Career plan:", a: ["MNC", "Startup", "Influencer", "Run away"], axis: [2, 3, 1, 4] },
];

const ENDINGS = [
  { id: 1, title: "Cottage Core", emoji: "🌿", msg: "You will end up in a small town with one cat and zero ambition. Beautiful." },
  { id: 2, title: "Corporate Slave", emoji: "💼", msg: "Excel at 9, dead at 6. The salary is 'okay'." },
  { id: 3, title: "Chaotic Genius", emoji: "🌀", msg: "Either you change the world or burn down a house. 50/50." },
  { id: 4, title: "Existential Mode", emoji: "🌌", msg: "You just questioned reality 4 times in a row. Touch grass." },
];

export function ExistentialQuiz({ highScore, onDone }: { highScore: number; onDone: (s: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [tally, setTally] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [over, setOver] = useState(false);
  const haptic = useHaptics();

  const choose = useCallback((axis: number) => {
    haptic("tick");
    setTally((t) => ({ ...t, [axis]: (t[axis] ?? 0) + 1 }));
    if (idx + 1 >= QUESTIONS.length) {
      setOver(true);
      haptic("success");
    } else {
      setIdx((i) => i + 1);
    }
  }, [idx, haptic]);

  const reset = () => {
    setIdx(0);
    setTally({ 1: 0, 2: 0, 3: 0, 4: 0 });
    setOver(false);
  };

  // Determine ending = highest tally
  const endingId = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "1");
  const ending = ENDINGS.find((e) => e.id === Number(endingId)) ?? ENDINGS[0];
  // score = consistency (max tally)
  const score = Math.max(...Object.values(tally)) * 10;

  const q = QUESTIONS[idx];

  return (
    <GameShell
      title="Existential Quiz"
      subtitle={`Question ${idx + 1}/${QUESTIONS.length}`}
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="radial-gradient(circle at center, #2d1b4e 0%, #0a0a1f 100%)"
      hud={
        <div className="flex h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full transition-all" style={{ width: `${((idx + (over ? 1 : 0)) / QUESTIONS.length) * 100}%`, background: "linear-gradient(90deg, #ec4899, #a855f7)" }} />
        </div>
      }
    >
      <div className="flex h-full flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!over && q && (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-sm"
            >
              <div className="text-center">
                <div className="text-xs font-mono uppercase tracking-widest text-white/50">question {idx + 1}</div>
                <div className="mt-2 text-2xl font-display font-bold text-white">{q.q}</div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {q.a.map((opt, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => choose(q.axis[i])}
                    className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center text-white text-base font-semibold backdrop-blur active:bg-white/10 min-h-20"
                  >
                    {opt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {over && (
        <ResultCard
          title={ending.title}
          emoji={ending.emoji}
          score={score}
          best={highScore}
          message={ending.msg}
          onPlayAgain={reset}
          onQuit={() => onDone(score)}
          accent="#a855f7"
        />
      )}
    </GameShell>
  );
}
