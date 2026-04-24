import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, ResultCard } from "../components/GameShell";
import { useHaptics } from "@/core/hooks/useHaptics";

type WaveType = "assignment" | "coffee" | "distraction";

interface Wave {
  id: number;
  type: WaveType;
  emoji: string;
  lane: number;
  y: number;
  speed: number; // percent per second
}

const ASSIGNMENT_EMOJI = ["📝", "📄", "📋", "📓"];
const DISTRACTION_EMOJI = ["📺", "🎮", "📱", "🍕"];
const LANE_X = [12, 30, 50, 70, 88];

function laneX(lane: number) {
  return LANE_X[lane % LANE_X.length];
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function AllNighter({
  highScore,
  onDone,
}: {
  highScore: number;
  onDone: (s: number) => void;
}) {
  const [stress, setStress] = useState(20);
  const [caffeine, setCaffeine] = useState(50);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [over, setOver] = useState(false);
  const [session, setSession] = useState(0);
  const [, forceFrame] = useState(0);

  const wavesRef = useRef<Wave[]>([]);
  const idRef = useRef(0);

  const overRef = useRef(false);
  const stressRef = useRef(stress);
  const caffeineRef = useRef(caffeine);
  const scoreRef = useRef(score);
  const timeRef = useRef(time);
  const comboRef = useRef(0);

  const haptic = useHaptics();

  useEffect(() => {
    overRef.current = over;
  }, [over]);

  useEffect(() => {
    stressRef.current = stress;
  }, [stress]);

  useEffect(() => {
    caffeineRef.current = caffeine;
  }, [caffeine]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    wavesRef.current = [];
    forceFrame((v) => v + 1);

    let spawnTimer: number | undefined;
    let tickTimer: number | undefined;
    let raf = 0;

    overRef.current = false;

    const spawn = () => {
      if (overRef.current) return;

      idRef.current += 1;

      const type: WaveType =
        Math.random() < 0.62
          ? "assignment"
          : Math.random() < 0.82
            ? "distraction"
            : "coffee";

      const emoji =
        type === "coffee"
          ? "☕"
          : type === "distraction"
            ? pick(DISTRACTION_EMOJI)
            : pick(ASSIGNMENT_EMOJI);

      const nextItem: Wave = {
        id: idRef.current,
        type,
        emoji,
        lane: Math.floor(Math.random() * LANE_X.length),
        y: -12,
        speed:
          type === "coffee"
            ? 18 + Math.random() * 8
            : type === "assignment"
              ? 20 + Math.random() * 10
              : 22 + Math.random() * 12,
      };

      wavesRef.current = [...wavesRef.current, nextItem];
      forceFrame((v) => v + 1);

      const nextDelay = Math.max(
        320,
        1150 - timeRef.current * 18 - scoreRef.current * 2,
      );

      spawnTimer = window.setTimeout(spawn, nextDelay);
    };

    spawnTimer = window.setTimeout(spawn, 550);

    tickTimer = window.setInterval(() => {
      if (overRef.current) return;

      const nextTime = timeRef.current + 1;
      timeRef.current = nextTime;
      setTime(nextTime);

      const nextCaffeine = Math.max(0, caffeineRef.current - 1.1);
      caffeineRef.current = nextCaffeine;
      setCaffeine(nextCaffeine);

      const nextStress = Math.min(
        100,
        stressRef.current + 0.4 + Math.max(0, 50 - nextCaffeine) * 0.04,
      );
      stressRef.current = nextStress;
      setStress(nextStress);

      if (nextStress >= 100) {
        overRef.current = true;
        setOver(true);
        haptic("error");
      }
    }, 1000);

    const loop = (now: number) => {
      if (overRef.current) return;

      const dt = Math.min(40, now - lastFrame) / 1000;
      lastFrame = now;

      if (wavesRef.current.length > 0) {
        let missedAssignments = 0;

        const moved: Wave[] = [];
        for (const wave of wavesRef.current) {
          const nextY = wave.y + wave.speed * dt;

          if (nextY > 112) {
            if (wave.type === "assignment") missedAssignments += 1;
            continue;
          }

          moved.push({ ...wave, y: nextY });
        }

        if (missedAssignments > 0) {
          const nextStress = Math.min(
            100,
            stressRef.current + missedAssignments * 6,
          );
          stressRef.current = nextStress;
          setStress(nextStress);

          if (nextStress >= 100) {
            overRef.current = true;
            setOver(true);
            haptic("error");
          }
        }

        wavesRef.current = moved;
        forceFrame((v) => v + 1);
      }

      raf = window.requestAnimationFrame(loop);
    };

    let lastFrame = performance.now();
    raf = window.requestAnimationFrame(loop);

    return () => {
      if (spawnTimer) window.clearTimeout(spawnTimer);
      if (tickTimer) window.clearInterval(tickTimer);
      window.cancelAnimationFrame(raf);
    };
  }, [session, haptic]);

  const tap = useCallback(
    (wave: Wave) => {
      if (overRef.current) return;

      wavesRef.current = wavesRef.current.filter((w) => w.id !== wave.id);
      forceFrame((v) => v + 1);

      if (wave.type === "assignment") {
        haptic("tick");

        const nextCombo = comboRef.current + 1;
        comboRef.current = nextCombo;

        const nextScore = scoreRef.current + (1 + Math.floor(nextCombo / 3));
        scoreRef.current = nextScore;
        setScore(nextScore);

        const nextStress = Math.max(0, stressRef.current - 2);
        stressRef.current = nextStress;
        setStress(nextStress);
      } else if (wave.type === "coffee") {
        haptic("success");

        comboRef.current = 0;

        const nextCaffeine = Math.min(100, caffeineRef.current + 25);
        caffeineRef.current = nextCaffeine;
        setCaffeine(nextCaffeine);

        const nextScore = scoreRef.current + 2;
        scoreRef.current = nextScore;
        setScore(nextScore);
      } else {
        haptic("error");

        comboRef.current = 0;

        const nextStress = Math.min(100, stressRef.current + 12);
        stressRef.current = nextStress;
        setStress(nextStress);

        const nextScore = Math.max(0, scoreRef.current - 3);
        scoreRef.current = nextScore;
        setScore(nextScore);

        if (nextStress >= 100) {
          overRef.current = true;
          setOver(true);
        }
      }
    },
    [haptic],
  );

  const reset = () => {
    overRef.current = false;

    comboRef.current = 0;
    idRef.current = 0;

    wavesRef.current = [];
    stressRef.current = 20;
    caffeineRef.current = 50;
    scoreRef.current = 0;
    timeRef.current = 0;

    setStress(20);
    setCaffeine(50);
    setScore(0);
    setTime(0);
    setOver(false);

    setSession((s) => s + 1);
  };

  const message =
    score >= 80
      ? "Submitted before sunrise. Legend."
      : score >= 40
        ? "B-tier all-nighter."
        : score >= 15
          ? "You finished... something."
          : "Fell asleep on keyboard.";

  return (
    <GameShell
      title="All-Nighter"
      subtitle="Tap assignments. Drink coffee. Avoid distractions."
      highScore={highScore}
      onQuit={() => onDone(score)}
      background="linear-gradient(180deg, #0c0a1f 0%, #1a0a2e 100%)"
      hud={
        <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-white">
          <div>★ {score}</div>

          <div className="flex flex-1 items-center gap-1.5">
            <span>☕</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all"
                style={{ width: `${caffeine}%`, background: "#f59e0b" }}
              />
            </div>
          </div>

          <div className="flex flex-1 items-center gap-1.5">
            <span>😰</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full transition-all"
                style={{ width: `${stress}%`, background: "#ef4444" }}
              />
            </div>
          </div>

          <div>⏱ {time}s</div>
        </div>
      }
    >
      <div className="absolute inset-0 overflow-hidden select-none">
        {wavesRef.current.map((w) => (
          <button
            key={w.id}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              tap(w);
            }}
            style={{
              position: "absolute",
              left: `${laneX(w.lane)}%`,
              top: `${w.y}%`,
              transform: "translate(-50%, -50%)",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              zIndex: 20 + w.id,
            }}
            className="cursor-pointer select-none text-4xl transition-transform active:scale-90 md:text-5xl"
          >
            {w.emoji}
          </button>
        ))}

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-amber-900/40 to-transparent" />
      </div>

      {over && (
        <ResultCard
          title="All-Nighter"
          emoji="☕"
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