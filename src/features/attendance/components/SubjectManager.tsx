import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, CalendarOff } from "lucide-react";
import { useStore, type Subject } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";
import { isoToday } from "@/features/attendance/logic";

interface Props {
  semesterId: string;
}

export function SubjectManager({ semesterId }: Props) {
  const sem = useStore((s) => s.semesters.find((x) => x.id === semesterId));
  const addSubject = useStore((s) => s.addSubject);
  const editSubject = useStore((s) => s.editSubject);
  const removeSubject = useStore((s) => s.removeSubject);
  const endSubjectClasses = useStore((s) => s.endSubjectClasses);
  const haptic = useHaptics();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(3);
  const [startDate, setStartDate] = useState("");

  if (!sem) return null;

  return (
    <Surface className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Subjects · {sem.name}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label="Add subject"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          {adding ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {adding && (
        <div className="space-y-2 rounded-[var(--radius-2)] bg-surface-2 p-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject name"
            className="w-full rounded-[var(--radius-2)] bg-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Subject name"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Credits</span>
            <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
              <button onClick={() => setCredits(Math.max(1, credits - 1))} className="h-9 w-7 text-muted-foreground" aria-label="Decrease credits">−</button>
              <span className="w-6 text-center font-mono text-sm">{credits}</span>
              <button onClick={() => setCredits(Math.min(8, credits + 1))} className="h-9 w-7 text-muted-foreground" aria-label="Increase credits">+</button>
            </div>
            <label className="flex-1 text-[10px] font-mono uppercase text-muted-foreground">
              Start
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-0.5 w-full rounded-[var(--radius-2)] bg-input px-2 py-1.5 text-xs" />
            </label>
            <button
              onClick={() => {
                if (!name.trim()) return;
                addSubject(sem.id, { name: name.trim(), credits, color: "", startDateISO: startDate || undefined });
                haptic("success");
                setName("");
                setStartDate("");
                setAdding(false);
              }}
              className="rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {sem.subjects.length === 0 ? (
        <div className="py-3 text-center text-xs text-muted-foreground">No subjects yet.</div>
      ) : (
        <div className="space-y-1.5">
          {sem.subjects.map((sub) => (
            <SubjectItem
              key={sub.id}
              sub={sub}
              onEdit={(p) => {
                editSubject(sem.id, sub.id, p);
                haptic("success");
              }}
              onRemove={() => {
                if (confirm(`Delete ${sub.name}? This removes its grade and schedule.`)) {
                  removeSubject(sem.id, sub.id);
                  haptic("warning");
                }
              }}
              onEndClasses={() => {
                if (confirm(`Mark ${sub.name} as ended? Future scheduling will be archived.`)) {
                  endSubjectClasses(sem.id, sub.id, isoToday());
                  haptic("tick");
                }
              }}
            />
          ))}
        </div>
      )}
    </Surface>
  );
}

interface ItemProps {
  sub: Subject;
  onEdit: (patch: Partial<Subject>) => void;
  onRemove: () => void;
  onEndClasses: () => void;
}

function SubjectItem({ sub, onEdit, onRemove, onEndClasses }: ItemProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const [credits, setCredits] = useState(sub.credits);
  const [start, setStart] = useState(sub.startDateISO ?? "");
  const [end, setEnd] = useState(sub.endDateISO ?? "");

  return (
    <div className="rounded-[var(--radius-2)] bg-surface-2 p-2">
      {editing ? (
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[var(--radius-2)] bg-input px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Subject name"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-muted-foreground">Credits</span>
            <div className="flex items-center gap-1 rounded-[var(--radius-2)] bg-input px-2">
              <button onClick={() => setCredits(Math.max(1, credits - 1))} className="h-8 w-7 text-muted-foreground" aria-label="Decrease credits">−</button>
              <span className="w-6 text-center font-mono text-xs">{credits}</span>
              <button onClick={() => setCredits(Math.min(8, credits + 1))} className="h-8 w-7 text-muted-foreground" aria-label="Increase credits">+</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-mono uppercase text-muted-foreground">
              Start
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-[var(--radius-2)] bg-input px-2 py-1.5 text-xs" />
            </label>
            <label className="text-[10px] font-mono uppercase text-muted-foreground">
              End
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-[var(--radius-2)] bg-input px-2 py-1.5 text-xs" />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="rounded-full px-3 py-1 text-xs surface-glass">Cancel</button>
            <button
              onClick={() => {
                if (!name.trim()) return;
                onEdit({ name: name.trim(), credits, startDateISO: start || undefined, endDateISO: end || undefined });
                setEditing(false);
              }}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: sub.color }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {sub.name}
              {sub.endDateISO && <span className="ml-2 text-[10px] text-muted-foreground">(ended)</span>}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {sub.credits} {sub.credits === 1 ? "credit" : "credits"}
              {sub.startDateISO && ` · from ${sub.startDateISO}`}
            </div>
          </div>
          <button onClick={() => setEditing(true)} aria-label={`Edit ${sub.name}`} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
            <Pencil size={13} />
          </button>
          {!sub.endDateISO && (
            <button onClick={onEndClasses} aria-label={`End classes for ${sub.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10 text-warning">
              <CalendarOff size={13} />
            </button>
          )}
          <button onClick={onRemove} aria-label={`Delete ${sub.name}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
