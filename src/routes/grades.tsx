import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useStore } from "@/core/store";
import { useHydrated } from "@/core/hooks/useHydrated";
import { Surface } from "@/core/components/Surface";
import { CountUp } from "@/core/components/CountUp";
import { RingProgress } from "@/core/components/RingProgress";
import { calcCGPA, calcSGPA, sgpaTrend } from "@/features/grades/logic";
import { SemPill } from "@/features/grades/components/SemPill";
import { SemesterDetail } from "@/features/grades/components/SemesterDetail";
import { SGPAChart } from "@/features/grades/components/SGPAChart";
import { TargetPanel } from "@/features/grades/components/TargetPanel";
import { SemesterComparison } from "@/features/grades/components/SemesterComparison";
import { Signature } from "@/core/components/Signature";

export const Route = createFileRoute("/grades")({
  component: GradesPage,
});

function GradesPage() {
  const hydrated = useHydrated();
  const semesters = useStore((s) => s.semesters);
  //const activeId = useStore((s) => s.activeSemesterId);
  //const setActive = useStore((s) => s.setActiveSemester);
  const totalSemesters = useStore((s) => s.settings.totalSemesters);
  const addSemester = useStore((s) => s.addSemester);

  const cgpa = useMemo(() => calcCGPA(semesters), [semesters]);
  const trend = useMemo(() => sgpaTrend(semesters), [semesters]);
  const sortedSems = useMemo(
    () => semesters.slice().sort((a, b) => a.number - b.number),
    [semesters],
  );

  const globalSemesterId = useStore((s) => s.activeSemesterId);
  const [selectedSemesterId, setSelectedSemesterId] = useState(
    globalSemesterId
  );

  const activeSem = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId),
    [semesters, selectedSemesterId],
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-4 pt-2">
      {/* CGPA hero */}
      <Surface className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Current CGPA
            </div>
            <div className="mt-1 text-5xl font-display font-bold text-neon">
              {hydrated ? <CountUp value={cgpa} decimals={2} /> : "0.00"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {semesters.length} of {totalSemesters} semesters
            </div>
          </div>
          <RingProgress value={cgpa / 10} size={92} stroke={8}>
            <div className="text-xs font-mono text-muted-foreground">/ 10</div>
          </RingProgress>
        </div>
      </Surface>

      <Signature page="grades" />

      {/* Semester strip */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
        role="tablist"
        aria-label="Semesters"
      >
        <SemPill label="All" active={selectedSemesterId === null} onClick={() => setSelectedSemesterId(null)}/>
        {sortedSems.map((sem) => (
          <SemPill
            key={sem.id}
            label={`Sem ${sem.number}`}
            active={selectedSemesterId === sem.id}
            onClick={() => setSelectedSemesterId(sem.id)}
            sgpa={calcSGPA(sem)}
          />
        ))}
        {semesters.length < totalSemesters && (
          <button
            onClick={addSemester}
            className="flex h-12 shrink-0 items-center gap-1 rounded-2xl surface-glass px-3 text-xs font-semibold text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Add semester"
          >
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeSem ? (
          <motion.div
            key="subject"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <SemesterDetail semId={activeSem.id} />
          </motion.div>
        ) : (
          <motion.div
            key="all"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <SGPAChart trend={trend} />
            <TargetPanel cgpa={cgpa} semesters={semesters} totalSemesters={totalSemesters} />
            <SemesterComparison />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}