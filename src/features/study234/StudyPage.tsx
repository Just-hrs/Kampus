import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useStudyStore } from "./store";
import { getMode, QUICK_START_MODE } from "./data/modes";
import { useStudyTimer } from "./hooks/useStudyTimer";

import { AmbientBackground } from "./components/AmbientBackground";
import { StudyHero } from "./components/StudyHero";
import { StudyTimer } from "./components/StudyTimer";
import { ModeSelector } from "./components/ModeSelector";
import { QuickStart } from "./components/QuickStart";
import { RecoveryCard } from "./components/RecoveryCard";
import { FocusStats } from "./components/FocusStats";
import { Heatmap } from "./components/Heatmap";
import { SessionMoodSheet } from "./components/SessionMoodSheet";

import type { Mood, StudyModeId } from "../study234/types";
import { getSuggestion } from "./suggestions/suggestionEngine";

const DAY_MS = 86_400_000;





/* ---------------- helpers ---------------- */



function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}


/* ---------------- page ---------------- */

export default function StudyPage() {
  const selectedModeId = useStudyStore((s) => s.selectedModeId);

  const sessions = useStudyStore((s) => s.sessions);
  const lastActiveAt = useStudyStore((s) => s.lastActiveAt);

  const setMode = useStudyStore((s) => s.setMode);
  const addSession = useStudyStore((s) => s.addSession);
  const setMoodInStore = useStudyStore((s) => s.setMood);

  const [quickActive, setQuickActive] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const activeMode = quickActive
    ? QUICK_START_MODE
    : getMode(selectedModeId);

  /* ---------------- session handling ---------------- */

  const handleFocusComplete = useCallback(
    (focusedSec: number) => {
      const id = addSession({
        modeId: activeMode.id,
        startedAt: Date.now() - focusedSec * 1000,
        durationSec: focusedSec,
        completed: true,
      });

      setPendingSessionId(id);
      if (quickActive) setQuickActive(false);
    },
    [addSession, activeMode.id, quickActive],
  );

  const timer = useStudyTimer({
    mode: activeMode,
    onFocusComplete: handleFocusComplete,
  });

  const handleSelectMode = useCallback(
    (id: StudyModeId) => {
      if (timer.phase !== "idle") return;
      setQuickActive(false);
      setMode(id);
    },
    [timer.phase, setMode],
  );

  const handleQuickStart = useCallback(() => {
    if (timer.phase !== "idle") return;
    setQuickActive(true);
    timer.start();
  }, [timer.phase, timer.start]);

  const handleMoodPick = useCallback(
    (mood: Mood) => {
      if (pendingSessionId) {
        setMoodInStore(pendingSessionId, mood);
      }
      setPendingSessionId(null);
    },
    [pendingSessionId, setMoodInStore],
  );

  /* ---------------- stats ---------------- */

  const stats = useMemo(() => {
    const today = startOfDay(Date.now());
    const weekStart = today - 6 * DAY_MS;

    let todayMin = 0;
    let weekMin = 0;
    const days = new Set<number>();

    for (const s of sessions) {
      const d = startOfDay(s.startedAt);
      const m = s.durationSec / 60;

      if (d === today) todayMin += m;
      if (d >= weekStart) weekMin += m;

      days.add(d);
    }

    let streak = 0;
    for (let d = today; ; d -= DAY_MS) {
      if (days.has(d)) streak++;
      else break;
    }

    return {
      todayMin: Math.round(todayMin),
      weekMin: Math.round(weekMin),
      streak,
      total: sessions.length,
    };
  }, [sessions]);

  /* ---------------- suggestion ---------------- */

  const todayPlan = useMemo(() => {
    return {
      plannedTotal: 120,
      blocks: [{ modeHint: selectedModeId, durationMin: 25 }],
    };
  }, [selectedModeId]);

  const suggestion = getSuggestion({
    plan: todayPlan,
    sessions,
    lastActiveAt,
  });

  const daysAway = useMemo(() => {
    if (!lastActiveAt || sessions.length === 0) return 0;
    return Math.floor((Date.now() - lastActiveAt) / DAY_MS);
  }, [lastActiveAt, sessions.length]);



  /* ---------------- UI ---------------- */

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <AmbientBackground />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto w-full max-w-3xl px-4 py-8 space-y-8"
      >
        {/* HERO */}
        <StudyHero totalSessions={stats.total} streak={stats.streak} />

        {daysAway >= 3 && <RecoveryCard daysAway={daysAway} />}

        {/* TIMER */}
        <section className="rounded-3xl border border-border/40 bg-card/50 p-6 backdrop-blur-xl">
          <StudyTimer
            mode={activeMode}
            phase={timer.phase}
            running={timer.running}
            remaining={timer.remaining}
            totalSec={timer.totalSec}
            progress={timer.progress}
            onStart={timer.start}
            onPause={timer.pause}
            onReset={timer.reset}
            onAdjust={timer.adjust}
          />
        </section>

        {/* NEXT ACTION */}
        <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            System suggestion
          </p>

          <p className="mt-1 text-sm font-medium">
            {suggestion.reason}
          </p>

          <button
            className="mt-3 rounded-xl bg-primary/10 px-4 py-2 text-sm"
            onClick={timer.start}
          >
            Start {suggestion.recommendedMin} min
          </button>
        </div>

        {/* QUICK START */}
        <QuickStart
          onStart={handleQuickStart}
          disabled={timer.phase !== "idle"}
        />

        {/* MUSIC SYSTEM (UI ONLY) */}
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Focus audio
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["Alpha Waves", "Beta Focus", "Gamma Drive", "Binaural Deep"].map(
              (m) => (
                <button
                  key={m}
                  className="rounded-2xl border border-border/50 bg-card/40 p-4 text-left text-sm hover:bg-card/70"
                >
                  {m}
                  <p className="text-xs text-muted-foreground">
                    2–3 loop tracks
                  </p>
                </button>
              ),
            )}
          </div>
        </section>

        {/* MODE */}
        <ModeSelector
          selectedId={selectedModeId}
          onSelect={handleSelectMode}
          disabled={timer.phase !== "idle"}
        />

        {/* TIMETABLE + PLANNING ENTRY POINTS */}
        <section className="grid gap-3 sm:grid-cols-2">
          <button className="rounded-2xl border border-border/60 bg-card/40 p-4 text-left">
            <p className="text-sm font-medium">Timetable</p>
            <p className="text-xs text-muted-foreground">
              Plan weekly structure
            </p>
          </button>

          <button className="rounded-2xl border border-border/60 bg-card/40 p-4 text-left">
            <p className="text-sm font-medium">Plan tomorrow</p>
            <p className="text-xs text-muted-foreground">
              Auto-suggest schedule
            </p>
          </button>
        </section>

        {/* STATS */}
        <FocusStats
          todayMin={stats.todayMin}
          weekMin={stats.weekMin}
          streak={stats.streak}
        />

        {/* HEATMAP */}
        <Heatmap sessions={sessions} />
      </motion.main>

      {/* MOOD */}
      <SessionMoodSheet
        open={pendingSessionId !== null}
        onOpenChange={(o) => {
          if (!o) setPendingSessionId(null);
        }}
        onPick={handleMoodPick}
      />
    </div>
  );
}