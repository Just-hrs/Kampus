import { useEffect } from "react";
import { useStudyCore } from "./studyCore";
import { STUDY_INFO } from "./studyInfo";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { getFocusScore, getInsight } from "./studyVisuals";

function InfoBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground">
      {text}
    </div>
  );
}

export default function StudyPage() {
  const core = useStudyCore();

  useEffect(() => {
    const id = setInterval(() => core.tick(), 1000);
    return () => clearInterval(id);
  }, [core]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 space-y-6">
      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Study</h1>
        <p className="text-xs text-muted-foreground">
          Stay consistent. Not perfect.
        </p>
      </div>

      {/* TIMER */}
      <div className="rounded-2xl border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm">Timer</span>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => alert(STUDY_INFO.timer.desc)}
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-3xl font-mono">
          {core.elapsedSec}s
        </div>

        <div className="flex gap-2">
          <Button onClick={core.start}>Start</Button>
          <Button variant="secondary" onClick={core.pause}>Pause</Button>
          <Button variant="ghost" onClick={core.reset}>Reset</Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3">
          <div className="flex justify-between">
            <span className="text-xs">Streak</span>
            <Info className="w-3 h-3" onClick={() => alert(STUDY_INFO.streak.desc)} />
          </div>
          <p className="text-lg">{core.streak} days</p>
        </div>

        <div className="rounded-xl border p-3">
          <div className="flex justify-between">
            <span className="text-xs">Sessions</span>
          </div>
          <p className="text-lg">{core.sessions}</p>
        </div>
      </div>

      {/* MOTIVATION BLOCK */}
      <InfoBox text="Even 10 minutes matters. Consistency beats intensity." />
    </div>
  );
}