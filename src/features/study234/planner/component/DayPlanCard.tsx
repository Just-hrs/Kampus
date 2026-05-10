import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DayPlan } from ".././types";

interface Props {
  plan: DayPlan;
}

function DayPlanCardBase({ plan }: Props) {
  const ratio =
    plan.plannedTotal === 0
      ? 0
      : plan.actualTotal / plan.plannedTotal;

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {plan.date}
          </p>

          <p className="text-xs text-muted-foreground">
            Drift {plan.driftScore > 0 ? "+" : ""}
            {plan.driftScore}%
          </p>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-muted-foreground">Planned</p>
            <p className="text-lg font-semibold">
              {plan.plannedTotal}m
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-2">
            <p className="text-muted-foreground">Done</p>
            <p className="text-lg font-semibold">
              {plan.actualTotal}m
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full transition-all",
              ratio < 0.5 && "bg-red-400/60",
              ratio >= 0.5 && ratio < 0.9 && "bg-yellow-400/60",
              ratio >= 0.9 && "bg-emerald-400/60"
            )}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>

        {/* BLOCK PREVIEW */}
        <div className="flex gap-1 overflow-x-auto">
          {(plan.blocks ?? []).slice(0, 5).map((b) => (
            <div
              key={b.id}
              className={cn(
                "min-w-[80px] rounded-lg px-2 py-1 text-[10px] text-center",
                b.completed
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-white/5 text-muted-foreground"
              )}
            >
              {b.type}
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}

export const DayPlanCard = memo(DayPlanCardBase);