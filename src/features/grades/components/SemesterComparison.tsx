import { useMemo } from "react";
import { useStore } from "@/core/store";
import { Surface } from "@/core/components/Surface";
import { calcSGPA } from "@/features/grades/logic";

export function SemesterComparison() {
  const semesters = useStore((s) => s.semesters);
  const data = useMemo(
    () =>
      semesters
        .slice()
        .sort((a, b) => a.number - b.number)
        .map((s) => ({ n: s.number, sgpa: calcSGPA(s) })),
    [semesters],
  );

  const max = 10;
  const filtered = data.filter((d) => d.sgpa > 0);

  if (filtered.length === 0) {
    return (
      <Surface className="p-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Semester Comparison
        </div>
        <div className="py-6 text-center text-sm text-muted-foreground">
          Add grades to see comparison.
        </div>
      </Surface>
    );
  }

  return (
    <Surface className="p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Semester Comparison
      </div>
      <div className="mt-3 flex items-end gap-2 h-32" role="img" aria-label="SGPA per semester">
        {data.map((d) => (
          <div key={d.n} className="flex flex-1 flex-col items-center gap-1">
            <div className="text-[10px] font-mono">{d.sgpa > 0 ? d.sgpa.toFixed(1) : "—"}</div>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${(d.sgpa / max) * 100}%`,
                background: d.sgpa > 0 ? "var(--grad-primary)" : "var(--muted)",
                minHeight: "4px",
                boxShadow: d.sgpa > 0 ? "var(--glow-primary)" : undefined,
              }}
            />
            <div className="text-[10px] text-muted-foreground">S{d.n}</div>
          </div>
        ))}
      </div>
    </Surface>
  );
}
