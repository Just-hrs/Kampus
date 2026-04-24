import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

interface NotifCard {
  id: number;
  type: "real" | "fake";
  title: string;
  body: string;
  x: number;
  y: number;
  bornAt: number;
  ttl: number;
}

const REAL_NOTIFS = [
  { title: "Assignment Due", body: "Submit in 1 hour" },
  { title: "Class Reminder", body: "Math at 9am" },
  { title: "Exam Tomorrow", body: "Don't forget chapter 5" },
  { title: "Library Hold", body: "Book ready for pickup" },
  { title: "Group Project", body: "Meeting at 4pm" },
];

const FAKE_NOTIFS = [
  { title: "Crypto Alert", body: "DOGE up 4%" },
  { title: "Sale!", body: "70% off everything" },
  { title: "Random Game", body: "Daily reward!" },
  { title: "Spam", body: "You won a prize 🎉" },
  { title: "Dating App", body: "5 new likes" },
  { title: "Brainrot Inc", body: "New meme dropped" },
];

export function AnxietyTap({
  highScore,
  onDone,
}: {
  highScore: number;
  onDone: (s: number) => void;
}) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [panic, setPanic] = useState(0);
  const [time, setTime] = useState(45);
  const [cards, setCards] = useState<NotifCard[]>([]);
  const [over, setOver] = useState(false);

  const idRef = useRef(0);
  const haptic = useHaptics();

  // Spawn loop
  useEffect(() => {
    if (over) return;

    const spawnRate = Math.max(450, 1200 - score * 8);

    const t = setInterval(() => {
      const isReal = Math.random() < 0.55;

      const pool = isReal ? REAL_NOTIFS : FAKE_NOTIFS;
      const item = pool[Math.floor(Math.random() * pool.length)];

      idRef.current++;

      setCards((c) => [
        ...c,
        {
          id: idRef.current,
          type: isReal ? "real" : "fake",
          title: item.title,
          body: item.body,

          // safer positions
          x: 5 + Math.random() * 55,
          y: 8 + Math.random() * 60,

          bornAt: Date.now(),
          ttl: 1800 + Math.random() * 800,
        },
      ]);
    }, spawnRate);

    return () => clearInterval(t);
  }, [over, score]);

  // Cleanup expired
  useEffect(() => {
    if (over) return;

    const t = setInterval(() => {
      const now = Date.now();

      setCards((c) => {
        const expired = c.filter((card) => now - card.bornAt > card.ttl);

        const alive = c.filter(
          (card) => now - card.bornAt <= card.ttl
        );

        // missed real notifs add panic
        const missedReal = expired.filter(
          (e) => e.type === "real"
        ).length;

        if (missedReal > 0) {
          setPanic((p) => Math.min(100, p + missedReal * 12));
          setCombo(0);
        }

        return alive;
      });
    }, 200);

    return () => clearInterval(t);
  }, [over]);

  // Timer
  useEffect(() => {
    if (over) return;

    if (time <= 0) {
      setOver(true);
      return;
    }

    const t = setTimeout(() => {
      setTime((s) => s - 1);
    }, 1000);

    return () => clearTimeout(t);
  }, [time, over]);

  // Panic = game over
  useEffect(() => {
    if (panic >= 100 && !over) {
      setOver(true);
    }
  }, [panic, over]);

  const tapCard = useCallback(
    (card: NotifCard) => {
      setCards((c) => c.filter((x) => x.id !== card.id));

      if (card.type === "real") {
        haptic("success");

        setCombo((c) => c + 1);

        setScore((s) => s + (1 + Math.floor(combo / 3)));

        setPanic((p) => Math.max(0, p - 4));
      } else {
        haptic("error");

        setCombo(0);

        setPanic((p) => Math.min(100, p + 18));

        setScore((s) => Math.max(0, s - 1));
      }
    },
    [combo, haptic]
  );

  const reset = () => {
    setScore(0);
    setCombo(0);
    setPanic(0);
    setTime(45);
    setCards([]);
    setOver(false);
  };

  const message =
    score >= 60
      ? "Inbox zero champion."
      : score >= 30
      ? "Manageable anxiety."
      : score >= 10
      ? "Mild dissociation."
      : "Phone wins. Always.";

  return (
    <GameShell
      title="Anxiety Tap"
      subtitle="Tap real notifications. Ignore spam."
      highScore={highScore}
      onQuit={() => onDone(score)}
      hud={
        <div className="flex items-center justify-between text-xs font-mono text-white">
          <div>⏱ {time}s</div>

          <div>
            ★ {score}{" "}
            {combo > 2 && (
              <span className="text-warning">
                ×{1 + Math.floor(combo / 3)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/60">
              PANIC
            </span>

            <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${panic}%`,
                  background:
                    panic > 70
                      ? "var(--destructive)"
                      : "var(--warning)",
                }}
              />
            </div>
          </div>
        </div>
      }
    >
      <motion.div
        animate={
          panic > 60
            ? { x: [0, -2, 2, -2, 0] }
            : {}
        }
        transition={{
          duration: 0.15,
          repeat: Infinity,
        }}
        className="absolute inset-0"
      >
        <AnimatePresence>
          {cards.map((c) => (
            <motion.button
              key={c.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}

              // instant taps
              onPointerDown={() => tapCard(c)}

              style={{
                position: "absolute",
                left: `${c.x}%`,
                top: `${c.y}%`,

                // responsive width
                width: "min(180px, 70vw)",

                // prevent overlap click bugs
                zIndex: c.id,
              }}
              className="rounded-2xl bg-white/95 p-3 text-left shadow-2xl backdrop-blur active:scale-95"
            >
              <div className="text-[10px] font-mono uppercase text-black/50">
                notification
              </div>

              <div className="text-sm font-bold text-black">
                {c.title}
              </div>

              <div className="text-xs text-black/70 truncate">
                {c.body}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {over && (
        <ResultCard
          title="Anxiety Tap"
          emoji="📱"
          score={score}
          best={highScore}
          message={message}
          onPlayAgain={reset}
          onQuit={() => onDone(score)}
          accent="#ec4899"
        />
      )}
    </GameShell>
  );
}