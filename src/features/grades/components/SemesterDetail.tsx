import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Pencil, Check, TrendingUp, TrendingDown } from "lucide-react";
import { useStore } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";
import { CountUp } from "@/core/components/CountUp";
import { RingProgress } from "@/core/components/RingProgress";
import {
  calcSGPA,
  semesterCompletion,
  strongestSubject,
  weakestSubject,
} from "@/features/grades/logic";
import { GradeSelector } from "@/features/grades/components/GradeSelector";
import { GradeRing } from "@/features/grades/components/GradeRing";
import { RadarChart } from "@/features/grades/components/RadarChart";
import { SubjectLineGraph } from "@/features/grades/components/SubjectLineGraph";
import type { Subject } from "@/core/store";

interface SubjectRowProps {
  semId: string;
  sub: Subject;
  grade: string | null;
}

const SubjectRow = memo(function SubjectRow({ semId, sub, grade }: SubjectRowProps) {
  const setGrade = useStore((s) => s.setGrade);
  const removeSubject = useStore((s) => s.removeSubject);
  const editSubject = useStore((s) => s.editSubject);
  const haptic = useHaptics();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [credits, setCredits] = useState(sub.credits);

  return (
    <Surface className="p-3">
      <div className="flex items-start gap-3">
        <GradeRing grade={grade} size={52} stroke={5} />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[var(--radius-2)] bg-input px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label="Subject name"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
                  <button onClick={() => setCredits(Math.max(1, credits - 1))} className="h-8 w-7 text-muted-foreground" aria-label="Decrease credits">−</button>
                  <span className="w-6 text-center font-mono text-xs">{credits}</span>
                  <button onClick={() => setCredits(Math.min(8, credits + 1))} className="h-8 w-7 text-muted-foreground" aria-label="Increase credits">+</button>
                </div>
                <button
                  onClick={() => {
                    if (!name.trim()) return;
                    editSubject(semId, sub.id, { name: name.trim(), credits });
                    haptic("success");
                    setEditing(false);
                  }}
                  className="ml-auto flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-primary-foreground"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => removeSubject(semId, sub.id)}
                  aria-label={`Delete ${sub.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sub.color }} aria-hidden="true" />
                <div className="truncate text-sm font-semibold">{sub.name}</div>
                <button
                  onClick={() => setEditing(true)}
                  aria-label={`Edit ${sub.name}`}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={12} />
                </button>
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {sub.credits} credits
              </div>
              <div className="mt-2">
                <GradeSelector
                  value={grade}
                  onChange={(g) => {
                    setGrade(semId, sub.id, g);
                    haptic(g ? "success" : "tick");
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Surface>
  );
});

export function SemesterDetail({ semId }: { semId: string }) {
  const sem = useStore((s) => s.semesters.find((x) => x.id === semId)!);
  const addSubject = useStore((s) => s.addSubject);
  const haptic = useHaptics();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCredits, setNewCredits] = useState(3);

  const sgpa = calcSGPA(sem);
  const completion = semesterCompletion(sem);
  const strongest = strongestSubject(sem);
  const weakest = weakestSubject(sem);

  return (
    <div className="space-y-4">
      <Surface className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {sem.name} · SGPA
            </div>
            <div className="mt-1 text-4xl font-display font-bold text-neon">
              <CountUp value={sgpa} decimals={2} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{Math.round(completion * 100)}% graded</div>
          </div>
          <RingProgress value={sgpa / 10} size={80} stroke={7}>
            <span className="text-[10px] font-mono">/10</span>
          </RingProgress>
        </div>
      </Surface>

      {(strongest || weakest) && (
        <div className="grid grid-cols-2 gap-2">
          {strongest && (
            <Surface className="p-3">
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-success">
                <TrendingUp size={10} /> Strongest
              </div>
              <div className="mt-1 truncate text-sm font-bold">{strongest.subject.name}</div>
              <div className="text-[10px] text-muted-foreground">Grade {strongest.grade}</div>
            </Surface>
          )}
          {weakest && weakest.subject.id !== strongest?.subject.id && (
            <Surface className="p-3">
              <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-destructive">
                <TrendingDown size={10} /> Weakest
              </div>
              <div className="mt-1 truncate text-sm font-bold">{weakest.subject.name}</div>
              <div className="text-[10px] text-muted-foreground">Grade {weakest.grade}</div>
            </Surface>
          )}
        </div>
      )}

      {sem.subjects.length >= 3 && (
        <Surface className="p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Subject Radar
          </div>
          <RadarChart semester={sem} />
        </Surface>
      )}

      {sem.subjects.length > 0 && (
        <Surface className="p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Grade Trend
          </div>
          <SubjectLineGraph semester={sem} />
        </Surface>
      )}

      {sem.subjects.length === 0 ? (
        <Surface className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No subjects yet for this semester.</p>
        </Surface>
      ) : (
        <div className="space-y-2">
          {sem.subjects.map((sub) => (
            <SubjectRow key={sub.id} semId={sem.id} sub={sub} grade={sem.grades[sub.id] ?? null} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {adding ? (
          <motion.div key="add-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Surface className="p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Subject name"
                  aria-label="Subject name"
                  className="flex-1 rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
                    <button onClick={() => setNewCredits(Math.max(1, newCredits - 1))} className="h-9 w-7 text-muted-foreground" aria-label="Decrease credits">−</button>
                    <span className="w-6 text-center font-mono text-sm">{newCredits}</span>
                    <button onClick={() => setNewCredits(Math.min(8, newCredits + 1))} className="h-9 w-7 text-muted-foreground" aria-label="Increase credits">+</button>
                  </div>
                  <button
                    onClick={() => {
                      if (!newName.trim()) return;
                      addSubject(sem.id, { name: newName.trim(), credits: newCredits, color: "" });
                      haptic("success");
                      setNewName("");
                      setAdding(false);
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    Add
                  </button>
                  <button onClick={() => setAdding(false)} className="rounded-full bg-muted px-3 py-2 text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            </Surface>
          </motion.div>
        ) : (
          <button
            key="add-btn"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-3)] border border-dashed border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus size={16} /> Add subject
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
