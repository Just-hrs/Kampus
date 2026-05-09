import { memo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LifeBuoy } from "lucide-react";

interface Props {
  daysAway: number;
}

function suggestion(days: number) {
  if (days >= 14) {
    return {
      title: `You disappeared for ${days} days.`,
      body: "Recommended: 1 short session today. Don't try to make it all up.",
    };
  }
  if (days >= 5) {
    return {
      title: `You disappeared for ${days} days.`,
      body: "Recommended: 2 short sessions today. Do NOT attempt full recovery.",
    };
  }
  return {
    title: `${days} days off — that's okay.`,
    body: "Ease back with one Burnout Recovery session. Momentum first, intensity later.",
  };
}

function RecoveryCardBase({ daysAway }: Props) {
  const s = suggestion(daysAway);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="flex gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.body}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const RecoveryCard = memo(RecoveryCardBase);
