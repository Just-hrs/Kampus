import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarOff,
  Calendar,
} from "lucide-react";

import { useStore, type Subject } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";
import { Surface } from "@/core/components/Surface";
import { RingProgress } from "@/core/components/RingProgress";

import {
  isoToday,
  overallPercentage,
  recoveryClasses,
  safeSkippable,
  subjectAttendance,
} from "@/features/attendance/logic";

interface Props {
  semesterId: string;
}

export function SubjectManager({ semesterId }: Props) {
  const sem = useStore((s) =>
    s.semesters.find((x) => x.id === semesterId),
  );

  const attendance = useStore((s) => s.attendance);
  const target = useStore(
    (s) => s.settings.attendanceTarget,
  );

  const addSubject = useStore((s) => s.addSubject);
  const editSubject = useStore((s) => s.editSubject);
  const removeSubject = useStore((s) => s.removeSubject);
  const endSubjectClasses = useStore(
    (s) => s.endSubjectClasses,
  );

  const haptic = useHaptics();

  const [adding, setAdding] = useState(false);

  const [name, setName] = useState("");
  const [credits, setCredits] = useState(3);
  const [startDate, setStartDate] = useState("*Set start Date");

  const rows = useMemo(
    () =>
      sem
        ? subjectAttendance(
            sem.subjects,
            attendance,
            target,
          )
        : [],
    [sem, attendance, target],
  );

  const overall = overallPercentage(rows);

  if (!sem) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <Surface className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
              Current Semester
            </div>

            <div className="mt-1 truncate text-xl font-black tracking-tight">
              {sem.name}
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {sem.subjects.length} subjects · Target{" "}
              {target}%
            </div>
          </div>

          <RingProgress
            value={overall / 100}
            size={74}
            stroke={6}
            color={
              overall < target - 10
                ? "var(--destructive)"
                : overall < target
                  ? "var(--warning)"
                  : "var(--success)"
            }
            glow={false}
          >
            <div className="text-center">
              <div className="text-[18px] font-black leading-none">
                {Math.round(overall)}%
              </div>

              <div className="mt-0.5 text-[9px] font-mono uppercase text-muted-foreground">
                overall
              </div>
            </div>
          </RingProgress>
        </div>
      </Surface>

      {/* Add Subject */}
      <Surface className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">
              Subjects
            </div>

            <div className="text-[11px] text-muted-foreground">
              Add, edit & manage
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${
              adding
                ? "rotate-90 bg-destructive text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {adding ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {adding && (
          <div className="mt-3 space-y-3 rounded-2xl bg-surface-2 p-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Operating Systems..."
              className="w-full rounded-2xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Start Date
                </span>

                <div className="flex items-center gap-2 rounded-2xl bg-input px-3">
                  <Calendar
                    size={14}
                    className="text-muted-foreground"
                  />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(e.target.value)
                    }
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                </div>
              </label>

              <div className="flex items-end">
                <div className="flex items-center gap-2 rounded-2xl bg-input px-2 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCredits(
                        Math.max(1, credits - 1),
                      )
                    }
                    className="h-8 w-8 rounded-xl bg-surface text-sm"
                  >
                    −
                  </button>

                  <div className="w-8 text-center text-sm font-bold">
                    {credits}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCredits(
                        Math.min(8, credits + 1),
                      )
                    }
                    className="h-8 w-8 rounded-xl bg-surface text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!name.trim()) return;

                addSubject(sem.id, {
                  name: name.trim(),
                  credits,
                  color: "",
                  startDateISO:
                    startDate || undefined,
                });

                haptic("success");

                setName("");
                setCredits(3);
                setStartDate("");
                setAdding(false);
              }}
              className="h-10 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.98]"
            >
              Add Subject
            </button>
          </div>
        )}
      </Surface>

      {/* Subject List */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <Surface className="p-6 text-center">
            <div className="text-sm text-muted-foreground">
              No subjects yet.
            </div>
          </Surface>
        ) : (
          rows.map((r) => (
            <SubjectItem
              key={r.subject.id}
              sub={r.subject}
              present={r.present}
              absent={r.absent}
              total={r.total}
              percentage={r.percentage}
              target={target}
              onEdit={(p) => {
                editSubject(
                  sem.id,
                  r.subject.id,
                  p,
                );

                haptic("success");
              }}
              onRemove={() => {
                if (
                  confirm(
                    `Pakka?  Delete ${r.subject.name}? This removes its grade and schedule. it can't be undone do only if wrong`,
                  )
                ) {
                  removeSubject(
                    sem.id,
                    r.subject.id,
                  );

                  haptic("warning");
                }
              }}
              onEndClasses={() => {
                if (
                  confirm(
                    `Mark ${r.subject.name} as ended?`,
                  )
                ) {
                  endSubjectClasses(
                    sem.id,
                    r.subject.id,
                    isoToday(),
                  );

                  haptic("tick");
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ItemProps {
  sub: Subject;

  present: number;
  absent: number;
  total: number;
  percentage: number;

  target: number;

  onEdit: (
    patch: Partial<Omit<Subject, "id">>,
  ) => void;

  onRemove: () => void;
  onEndClasses: () => void;
}

function SubjectItem({
  sub,
  present,
  absent,
  total,
  percentage,
  target,
  onEdit,
  onRemove,
  onEndClasses,
}: ItemProps) {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(sub.name);

  const [credits, setCredits] = useState(
    sub.credits,
  );

  const [start, setStart] = useState(
    sub.startDateISO ?? "",
  );

  const [end, setEnd] = useState(
    sub.endDateISO ?? "",
  );

  const skip = safeSkippable(
    present,
    total,
    target,
  );

  const recover = recoveryClasses(
    present,
    total,
    target,
  );

  const statusColor =
    percentage < target - 10
      ? "var(--destructive)"
      : percentage < target
        ? "var(--warning)"
        : "var(--success)";

  return (
    <Surface className="p-4">
      {editing ? (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full rounded-2xl bg-input px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Start
              </span>

              <input
                type="date"
                value={start}
                onChange={(e) =>
                  setStart(e.target.value)
                }
                className="w-full rounded-2xl bg-input px-3 py-2 text-xs outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                End
              </span>

              <input
                type="date"
                value={end}
                onChange={(e) =>
                  setEnd(e.target.value)
                }
                className="w-full rounded-2xl bg-input px-3 py-2 text-xs outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-2xl bg-input px-2 py-2">
              <button
                type="button"
                onClick={() =>
                  setCredits(
                    Math.max(1, credits - 1),
                  )
                }
                className="h-8 w-8 rounded-xl bg-surface"
              >
                −
              </button>

              <div className="w-8 text-center text-sm font-bold">
                {credits}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCredits(
                    Math.min(8, credits + 1),
                  )
                }
                className="h-8 w-8 rounded-xl bg-surface"
              >
                +
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-2xl px-4 py-2 text-xs surface-glass"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!name.trim()) return;

                  onEdit({
                    name: name.trim(),
                    credits,
                    startDateISO:
                      start || undefined,
                    endDateISO:
                      end || undefined,
                  });

                  setEditing(false);
                }}
                className="flex items-center gap-1 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <Check size={12} />
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <RingProgress
            value={percentage / 100}
            size={58}
            stroke={5}
            color={statusColor}
            glow={false}
          >
            <span className="text-[11px] font-bold">
              {Math.round(percentage)}%
            </span>
          </RingProgress>

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="truncate text-[15px] font-semibold tracking-tight"
                  style={{ color: sub.color }}
                >
                  {sub.name}
                </div>

                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {present}P · {absent}A · {total} held
                  {" · "}
                  {sub.credits} credits
                </div>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <Pencil size={14} />
                </button>

                {!sub.endDateISO && (
                  <button
                    type="button"
                    onClick={onEndClasses}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-warning transition-colors hover:bg-warning/10"
                  >
                    <CalendarOff size={14} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onRemove}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="mt-2 text-[11px]">
              {percentage >= target ? (
                <span className="text-success">
                  Can skip {skip} more classes
                </span>
              ) : (
                <span className="text-warning">
                  Attend {recover} more to recover
                </span>
              )}
            </div>

            {/* Dates */}
            {(sub.startDateISO ||
              sub.endDateISO) && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                {sub.startDateISO &&
                  `Started ${sub.startDateISO}`}

                {sub.startDateISO &&
                  sub.endDateISO &&
                  " · "}

                {sub.endDateISO &&
                  `Ended ${sub.endDateISO}`}
              </div>
            )}
          </div>
        </div>
      )}
    </Surface>
  );
}