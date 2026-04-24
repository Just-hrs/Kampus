import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy } from "lucide-react";
import { useStore } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Surface } from "@/core/components/Surface";
import { dateHash } from "@/core/lib/utils";
import { Signature } from "@/core/components/Signature";
import { BootSequence } from "@/core/components/BootSequence";
import { GAMES, GAME_BOOT_LINES } from "@/features/games/games";

const AnxietyTap = lazy(() => import("@/features/games/engines/AnxietyTap").then((m) => ({ default: m.AnxietyTap })));
const BrainRotRoulette = lazy(() => import("@/features/games/engines/BrainRotRoulette").then((m) => ({ default: m.BrainRotRoulette })));
const ReflexLab = lazy(() => import("@/features/games/engines/ReflexLab").then((m) => ({ default: m.ReflexLab })));
const CollegeSim = lazy(() => import("@/features/games/engines/CollegeSim").then((m) => ({ default: m.CollegeSim })));
const AllNighter = lazy(() => import("@/features/games/engines/AllNighter").then((m) => ({ default: m.AllNighter })));
const DeadlineEscape = lazy(() => import("@/features/games/engines/DeadlineEscape").then((m) => ({ default: m.DeadlineEscape })));
const ExistentialQuiz = lazy(() => import("@/features/games/engines/ExistentialQuiz").then((m) => ({ default: m.ExistentialQuiz })));

export const Route = createFileRoute("/games")({
  component: GamesPage,
});

function GamesPage() {
  const [booted, setBooted] = useState(false);
  return (
    <AnimatePresence mode="wait">
      {!booted ? (
        <BootSequence
          key="boot"
          lines={GAME_BOOT_LINES}
          label="GAME_CENTER · v2.0"
          emoji="🎮"
          onDone={() => setBooted(true)}
        />
      ) : (
        <GameHub key="hub" />
      )}
    </AnimatePresence>
  );
}

function GameHub() {
  const hydrated = useHydrated();
  const games = useStore((s) => s.games);
  const recordPlay = useStore((s) => s.recordGamePlay);
  const haptic = useHaptics();
  const [playing, setPlaying] = useState<string | null>(null);

  const featuredIdx = dateHash() % GAMES.length;
  const featured = GAMES[featuredIdx];
  const playingHigh = playing ? (games[playing]?.highScore ?? 0) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-6xl space-y-4 px-4 pt-2 pb-24"
    >
      <Signature page="games" />
      <Surface className="p-4 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <Star size={12} className="text-warning" /> Daily Featured
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="text-5xl">{featured.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-display font-bold">{featured.name}</div>
              <div className="text-xs text-muted-foreground">{featured.desc}</div>
            </div>
            <button
              onClick={() => {
                setPlaying(featured.id);
                haptic("success");
              }}
              className="rounded-full px-4 py-2 text-xs font-bold text-primary-foreground"
              style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
            >
              Play
            </button>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((g) => {
          const stat = games[g.id];
          return (
            <motion.button
              whileTap={{ scale: 0.96 }}
              key={g.id}
              onClick={() => {
                setPlaying(g.id);
                haptic("tick");
              }}
              className={`surface-glass rounded-[var(--radius-3)] p-4 text-left bg-gradient-to-br ${g.gradient}`}
            >
              <div className="text-3xl mb-2">{g.emoji}</div>
              <div className="text-sm font-bold text-white">{g.name}</div>
              <div className="text-[10px] text-white/80 mt-0.5">{g.tag}</div>
              {hydrated && stat && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-white/90">
                  <Trophy size={10} /> {stat.highScore}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {playing && (
          <Suspense fallback={<div className="fixed inset-0 z-[70] bg-black flex items-center justify-center text-white/60 text-sm font-mono">Loading game…</div>}>
            <GameSwitch
              id={playing}
              highScore={playingHigh}
              onDone={(score) => {
                recordPlay(playing, score);
                setPlaying(null);
                haptic("success");
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GameSwitch({ id, highScore, onDone }: { id: string; highScore: number; onDone: (s: number) => void }) {
  switch (id) {
    case "anxiety-tap": return <AnxietyTap highScore={highScore} onDone={onDone} />;
    case "brain-rot": return <BrainRotRoulette highScore={highScore} onDone={onDone} />;
    case "reflex-lab": return <ReflexLab highScore={highScore} onDone={onDone} />;
    case "college-sim": return <CollegeSim highScore={highScore} onDone={onDone} />;
    case "all-nighter": return <AllNighter highScore={highScore} onDone={onDone} />;
    case "deadline-escape": return <DeadlineEscape highScore={highScore} onDone={onDone} />;
    case "existential-quiz": return <ExistentialQuiz highScore={highScore} onDone={onDone} />;
    default: return null;
  }
}

export default GamesPage;
