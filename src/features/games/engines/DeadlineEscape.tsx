import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

const LANES = 3;
const LANE_WIDTH = 100 / LANES;

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: "deadline" | "boost";
}

export function DeadlineEscape({
  highScore,
  onDone,
}: {
  highScore: number;
  onDone: (s: number) => void;
}) {
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0.65);
  const [over, setOver] = useState(false);
  const [shield, setShield] = useState(0);

  const [level, setLevel] = useState(1);
  const [showSpeedAlert, setShowSpeedAlert] = useState(false);

  const idRef = useRef(0);
  const overRef = useRef(false);
  const laneRef = useRef(1);
  const shieldRef = useRef(0);
  const speedRef = useRef(0.65);
  const scoreRef = useRef(0);

  const haptic = useHaptics();

  useEffect(() => {
    overRef.current = over;
  }, [over]);

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    shieldRef.current = shield;
  }, [shield]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // SPAWN LOOP
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const spawn = () => {
      if (overRef.current) return;

      idRef.current++;

      setObstacles((prev) => [
        ...prev,
        {
          id: idRef.current,
          lane: Math.floor(Math.random() * LANES),
          y: -12,
          type: Math.random() < 0.14 ? "boost" : "deadline",
        },
      ]);

      const next =
        scoreRef.current < 40
          ? 950
          : scoreRef.current < 80
            ? 700
            : scoreRef.current < 140
              ? 520
              : 380;

      timeoutId = setTimeout(spawn, next);
    };

    timeoutId = setTimeout(spawn, 1000);

    return () => clearTimeout(timeoutId);
  }, [over]);

  // GAME LOOP
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      if (!overRef.current) {
        const factor = dt / 16.67;

        setObstacles((current) => {
          const next: Obstacle[] = [];

          for (const o of current) {
            const ny = o.y + speedRef.current * factor;

            // remove offscreen
            if (ny > 115) continue;

            // collision
            const hit =
              ny > 78 &&
              ny < 92 &&
              o.lane === laneRef.current;

            if (hit) {
              if (o.type === "deadline") {
                if (shieldRef.current > 0) {
                  shieldRef.current -= 1;
                  setShield((s) => Math.max(0, s - 1));
                  haptic("warning");
                  continue;
                }

                overRef.current = true;
                setOver(true);
                haptic("error");
                continue;
              }

              if (o.type === "boost") {
                shieldRef.current += 1;
                setShield((s) => s + 1);
                setScore((s) => s + 5);
                haptic("success");
                continue;
              }
            }

            next.push({
              ...o,
              y: ny,
            });
          }

          return next;
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [haptic]);

  // SCORE + LEVEL SYSTEM
  useEffect(() => {
    const t = setInterval(() => {
      if (overRef.current) return;

      setScore((s) => {
        const next = s + 1;

        const nextLevel = Math.floor(next / 25) + 1;

        if (nextLevel !== level) {
          setLevel(nextLevel);

          setSpeed((sp) => Math.min(3.2, sp + 0.22));

          setShowSpeedAlert(true);

          setTimeout(() => {
            setShowSpeedAlert(false);
          }, 1200);

          haptic("warning");
        }

        return next;
      });
    }, 500);

    return () => clearInterval(t);
  }, [level, haptic]);

  // KEYBOARD
  const move = useCallback(
    (dir: -1 | 1) => {
      if (overRef.current) return;

      haptic("tick");

      setLane((l) => Math.max(0, Math.min(LANES - 1, l + dir)));
    },
    [haptic]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [move]);

  // TOUCH
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];

    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;

    const t = e.changedTouches[0];

    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 1 : -1);
    }

    touchRef.current = null;
  };

  // RESET
  const reset = () => {
    idRef.current = 0;
    overRef.current = false;
    laneRef.current = 1;
    shieldRef.current = 0;
    speedRef.current = 0.65;
    scoreRef.current = 0;

    setLane(1);
    setObstacles([]);
    setScore(0);
    setSpeed(0.65);
    setShield(0);
    setLevel(1);
    setOver(false);
    setShowSpeedAlert(false);
  };

  const message =
    score >= 250
      ? "Academic demon mode unlocked."
      : score >= 150
        ? "Semester survived somehow."
        : score >= 80
          ? "Barely holding together."
          : "Cooked immediately.";

  return (
    <GameShell
      title="Deadline Escape"
      subtitle="Swipe lanes. Avoid deadlines. Survive academia."
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="linear-gradient(180deg, #081120 0%, #031b2d 100%)"
      hud={
        <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
          <div>★ {score}</div>
          <div>LEVEL {level}</div>
          <div>🛡 {shield}</div>
        </div>
      }
    >
      <div
        className="absolute inset-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "none" }}
      >
        {/* SPEED ALERT */}
        <AnimatePresence>
          {showSpeedAlert && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              className="absolute top-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-yellow-400/40 bg-yellow-400/20 px-5 py-2 text-sm font-black tracking-widest text-yellow-300 backdrop-blur-sm"
            >
              ⚠ SPEED UP
            </motion.div>
          )}
        </AnimatePresence>

        {/* ROAD GLOW */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,255,255,0.08),transparent_60%)]" />

        {/* LANES */}
        <div className="absolute inset-0 pointer-events-none">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-dashed border-cyan-400/20"
              style={{
                left: `${i * LANE_WIDTH}%`,
              }}
            />
          ))}
        </div>

        {/* OBSTACLES */}
        <AnimatePresence>
          {obstacles.map((o) => (
            <motion.div
              key={o.id}
              initial={{
                opacity: 0,
                scale: 0.6,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                duration: 0.12,
              }}
              style={{
                position: "absolute",
                left: `${o.lane * LANE_WIDTH + LANE_WIDTH / 2}%`,
                top: `${o.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold backdrop-blur-sm ${
                o.type === "deadline"
                  ? "bg-red-500/90 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                  : "bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)]"
              }`}
            >
              {o.type === "deadline" ? "📅" : "⚡"}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* PLAYER */}
        <motion.div
          animate={{
            left: `${lane * LANE_WIDTH + LANE_WIDTH / 2}%`,
          }}
          transition={{
            type: "spring",
            damping: 18,
            stiffness: 320,
          }}
          style={{
            position: "absolute",
            top: "85%",
            transform: "translate(-50%, -50%)",
          }}
          className="z-30 text-5xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
        >
          🏃
        </motion.div>

        {/* CONTROLS */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex">
          <button
            onClick={() => move(-1)}
            className="flex-1 h-24 border-r border-cyan-400/10 bg-black/20 text-3xl font-black text-cyan-200 backdrop-blur-sm active:bg-cyan-400/10"
          >
            ←
          </button>

          <button
            onClick={() => move(1)}
            className="flex-1 h-24 bg-black/20 text-3xl font-black text-cyan-200 backdrop-blur-sm active:bg-cyan-400/10"
          >
            →
          </button>
        </div>
      </div>

      {over && (
        <ResultCard
          title="Deadline Escape"
          emoji="🏃"
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