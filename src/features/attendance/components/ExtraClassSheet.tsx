import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useStore } from "@/core/store";
import { useHaptics } from "@/core/hooks/useHaptics";

interface ExtraClassSheetProps {
  open: boolean;
  onClose: () => void;
  dateISO: string;
  subjects: {
    id: string;
    name: string;
    color?: string;
  }[];
}

export function ExtraClassSheet({
  open,
  onClose,
  dateISO,
  subjects,
}: ExtraClassSheetProps) {
  const haptic = useHaptics();

  const addExtraClass = useStore((s) => s.addExtraClass);
  const schedule = useStore((s) => s.schedule);

  const setHolidayOverride = useStore(
    (s) => s.setHolidayOverride,
  );

  const [selectedSubjects, setSelectedSubjects] =
    useState<string[]>([]);

  const [time, setTime] = useState("");
  const weekday = new Date(dateISO).getDay();

  const scheduledIds =
    schedule[weekday] ?? [];

  const availableSubjects = subjects.filter(
    (sub) =>
      !scheduledIds.includes(sub.id),
  );

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );

    haptic("tick");
  };

  const handleSave = () => {
    if (selectedSubjects.length === 0) return;

    setHolidayOverride(dateISO, "working");

    selectedSubjects.forEach((subjectId) => {
      addExtraClass({
        dateISO,
        subjectId,
        time: time || undefined,
      });
    });

    haptic("success");

    setSelectedSubjects([]);
    setTime("");

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18 }}
          className="mt-4 rounded-3xl border border-border/40 bg-surface-2/70 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
                Extra Classes
              </div>

              <div className="mt-1 text-base font-black tracking-tight">
                Kaunsi classes hain?
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-background px-3 py-2 text-[11px] font-semibold"
            >
              Cancel
            </button>
          </div>

          {availableSubjects.length === 0 && (
            <div className="mt-4 rounded-2xl bg-background/70 p-4 text-center">
              <div className="text-sm font-bold">
                😭 Sab classes already hain
              </div>

              <div className="mt-1 text-[11px] text-muted-foreground">
                University ne already torture optimize kar diya.
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {availableSubjects.map((sub) => {
              const selected =
              selectedSubjects.includes(sub.id);

              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() =>
                    toggleSubject(sub.id)
                  }
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/40 bg-background"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={
              selectedSubjects.length === 0 ||
              availableSubjects.length === 0
            }
            onClick={handleSave}
            className="mt-4 h-12 w-full rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition-all disabled:opacity-50"
          >
            Save Extra Classes
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}