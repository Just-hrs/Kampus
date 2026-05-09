import { memo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Mood } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (mood: Mood) => void;
}

const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "great", label: "Locked in", emoji: "🔥" },
  { id: "ok", label: "Okay", emoji: "🙂" },
  { id: "tired", label: "Drained", emoji: "😴" },
  { id: "anxious", label: "Anxious", emoji: "😬" },
];

function SessionMoodSheetBase({ open, onOpenChange, onPick }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-border/60">
        <SheetHeader className="text-left">
          <SheetTitle>How did that feel?</SheetTitle>
          <SheetDescription>
            Honest answers help tune your next session.
          </SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-2 p-4">
          {MOODS.map((m) => (
            <Button
              key={m.id}
              variant="outline"
              className="h-16 justify-start text-base"
              onClick={() => onPick(m.id)}
            >
              <span className="mr-2 text-xl">{m.emoji}</span>
              {m.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const SessionMoodSheet = memo(SessionMoodSheetBase);
