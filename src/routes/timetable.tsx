import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Plus, X, Pencil, Check, Trash2 } from "lucide-react";
import { useStore, type DaySchedule } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";

export const Route = createFileRoute("/timetable")({
  component: TimetableEditorPage,
});

const STEPS = ["subjects", "schedule", "done"] as const;
type Step = (typeof STEPS)[number];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function TimetableEditorPage() {
  const navigate = useNavigate();
  const haptic = useHaptics();
  const semesters = useStore((s) => s.semesters);
  const activeSemId = useStore((s) => s.activeSemesterId);
  const semId = activeSemId ?? semesters[semesters.length - 1]?.id ?? "";
  const sem = semesters.find((s) => s.id === semId);

  const addSubject = useStore((s) => s.addSubject);
  const editSubject = useStore((s) => s.editSubject);
  const removeSubject = useStore((s) => s.removeSubject);
  const schedule = useStore((s) => s.schedule);
  const replaceSchedule = useStore((s) => s.replaceSchedule);

  const [step, setStep] = useState<Step>("subjects");
  const [draft, setDraft] = useState<DaySchedule>(() => ({ ...schedule }));
  const [newName, setNewName] = useState("");
  const [newCr, setNewCr] = useState(3);

  if (!sem) {
    return (
      <div className="mx-auto max-w-md space-y-3 px-4 pt-4">
        <Surface className="p-4 text-center text-sm text-muted-foreground">
          Add a semester first.
        </Surface>
      </div>
    );
  }

  const idx = STEPS.indexOf(step);
  const progress = ((idx + 1) / STEPS.length) * 100;

  const next = () => {
    haptic("success");
    if (step === "schedule") {
      replaceSchedule(draft);
      setStep("done");
      return;
    }
    setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  };

  const finish = () => {
    haptic("success");
    void navigate({ to: "/attendance" });
  };

  return (
    <div className="relative min-h-svh flex flex-col bg-background">
      <div className="aurora-bg" />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-center gap-2 px-4 pt-4">
          <button
            onClick={() => void navigate({ to: "/attendance" })}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full surface-glass"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Edit Timetable · {sem.name}
            </div>
            <div className="text-base font-display font-bold capitalize">{step}</div>
          </div>
        </div>
        <div className="px-4 pt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full" animate={{ width: `${progress}%` }} style={{ background: "var(--grad-primary)" }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
          {step === "subjects" && (
            <div className="mx-auto w-full max-w-md space-y-3">
              <Surface className="p-3 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Subject</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. DBMS"
                      className="mt-1 w-full rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Credits</label>
                    <div className="mt-1 flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
                      <button onClick={() => setNewCr(Math.max(1, newCr - 1))} className="h-9 w-7 text-muted-foreground">−</button>
                      <span className="w-6 text-center font-mono text-sm">{newCr}</span>
                      <button onClick={() => setNewCr(Math.min(8, newCr + 1))} className="h-9 w-7 text-muted-foreground">+</button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!newName.trim()) return;
                      addSubject(sem.id, { name: newName.trim(), credits: newCr, color: "" });
                      setNewName("");
                      haptic("success");
                    }}
                    aria-label="Add subject"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </Surface>

              {sem.subjects.length === 0 ? (
                <Surface className="p-4 text-center text-xs text-muted-foreground">
                  Add at least one subject.
                </Surface>
              ) : (
                sem.subjects.map((s) => (
                  <SubjectRow
                    key={s.id}
                    name={s.name}
                    credits={s.credits}
                    color={s.color}
                    startDateISO={s.startDateISO}
                    endDateISO={s.endDateISO}
                    onSave={(p) => {
                      editSubject(sem.id, s.id, p);
                      haptic("success");
                    }}
                    onDelete={() => {
                      if (confirm(`Delete ${s.name}?`)) {
                        removeSubject(sem.id, s.id);
                        // also strip from draft schedule
                        setDraft((d) => {
                          const n: DaySchedule = {};
                          for (const [day, ids] of Object.entries(d)) n[Number(day)] = (ids as string[]).filter((id) => id !== s.id);
                          return n;
                        });
                        haptic("warning");
                      }
                    }}
                  />
                ))
              )}
            </div>
          )}

          {step === "schedule" && (
            <div className="mx-auto w-full max-w-md space-y-2">
              <div className="text-xs text-muted-foreground px-1">Tap subjects to add/remove from each day.</div>
              {DAY_NAMES.map((d, di) => {
                const day = (draft[di] as string[] | undefined) ?? [];
                return (
                  <Surface key={di} className="p-3">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">{d}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {sem.subjects.map((s) => {
                        const on = day.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => {
                              setDraft((cur) => {
                                const arr = (cur[di] as string[] | undefined) ?? [];
                                return { ...cur, [di]: on ? arr.filter((x) => x !== s.id) : [...arr, s.id] };
                              });
                              haptic("tick");
                            }}
                            className="rounded-full px-3 py-1.5 text-xs font-semibold"
                            style={{
                              background: on ? s.color : "var(--surface-2)",
                              color: on ? "white" : "var(--muted-foreground)",
                            }}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                      {sem.subjects.length === 0 && (
                        <div className="text-xs text-muted-foreground">No subjects.</div>
                      )}
                    </div>
                  </Surface>
                );
              })}
            </div>
          )}

          {step === "done" && (
            <div className="mx-auto w-full max-w-md text-center pt-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4" transition={{ type: "spring" }}>
                ✅
              </motion.div>
              <h2 className="text-2xl font-display font-bold">Timetable saved.</h2>
              <p className="text-muted-foreground mt-2 text-sm">Your weekly schedule is ready.</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-gradient-to-t from-background to-transparent">
          <button
            onClick={step === "done" ? finish : next}
            disabled={step === "subjects" && sem.subjects.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
            style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
          >
            {step === "done" ? "Back to Attendance" : step === "schedule" ? "Save Timetable" : "Continue"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  name: string;
  credits: number;
  color: string;
  startDateISO?: string;
  endDateISO?: string;
  onSave: (patch: { name?: string; credits?: number; startDateISO?: string; endDateISO?: string }) => void;
  onDelete: () => void;
}

function SubjectRow({ name, credits, color, startDateISO, endDateISO, onSave, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState(name);
  const [c, setC] = useState(credits);
  const [start, setStart] = useState(startDateISO ?? "");
  const [end, setEnd] = useState(endDateISO ?? "");

  return (
    <Surface className="p-3">
      {editing ? (
        <div className="space-y-2">
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            className="w-full rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Subject name"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Credits</span>
            <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
              <button onClick={() => setC(Math.max(1, c - 1))} className="h-8 w-7 text-muted-foreground">−</button>
              <span className="w-6 text-center font-mono text-xs">{c}</span>
              <button onClick={() => setC(Math.min(8, c + 1))} className="h-8 w-7 text-muted-foreground">+</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">
              Start date
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-[var(--radius-2)] bg-input px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">
              End date
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-[var(--radius-2)] bg-input px-2 py-1.5 text-xs" />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setEditing(false)} className="rounded-full px-3 py-1.5 text-xs surface-glass">Cancel</button>
            <button
              onClick={() => {
                if (!n.trim()) return;
                onSave({
                  name: n.trim(),
                  credits: c,
                  startDateISO: start || undefined,
                  endDateISO: end || undefined,
                });
                setEditing(false);
              }}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="text-[10px] text-muted-foreground">
              {credits} {credits === 1 ? "credit" : "credits"}
              {startDateISO && ` · from ${startDateISO}`}
              {endDateISO && ` · until ${endDateISO}`}
            </div>
          </div>
          <button onClick={() => setEditing(true)} aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setEditing(true)}
            aria-label="More"
            className="hidden"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </Surface>
  );
}
