import { memo, useMemo } from "react";
import type { Semester } from "@/core/store";
import { GRADE_POINTS } from "@/features/grades/logic";

interface RadarChartProps {
  semester: Semester;
  size?: number;
}

/** Skill-tree style radar of subjects in a semester. */
export const RadarChart = memo(function RadarChart({ semester, size = 260 }: RadarChartProps) {
  const data = useMemo(() => {
    return semester.subjects.map((sub) => {
      const g = semester.grades[sub.id];
      const points = g && g in GRADE_POINTS ? GRADE_POINTS[g] : 0;
      return { name: sub.name, color: sub.color, value: points / 10 };
    });
  }, [semester]);

  if (data.length < 3) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-xs text-muted-foreground">
        Add at least 3 subjects with grades to view the radar map.
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const ring = (frac: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = angle(i);
      return `${cx + Math.cos(a) * r * frac},${cy + Math.sin(a) * r * frac}`;
    }).join(" ");

  const dataPoints = data
    .map((d, i) => {
      const a = angle(i);
      const rr = r * d.value;
      return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Subject radar">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="var(--border)" strokeOpacity={0.4} strokeWidth={1} />
      ))}
      {data.map((_, i) => {
        const a = angle(i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="var(--border)"
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={dataPoints}
        fill="var(--primary)"
        fillOpacity={0.25}
        stroke="var(--primary)"
        strokeWidth={2}
        style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
      />
      {data.map((d, i) => {
        const a = angle(i);
        const rr = r * d.value;
        return <circle key={`p-${i}`} cx={cx + Math.cos(a) * rr} cy={cy + Math.sin(a) * rr} r={4} fill={d.color} />;
      })}
      {data.map((d, i) => {
        const a = angle(i);
        const lx = cx + Math.cos(a) * (r + 16);
        const ly = cy + Math.sin(a) * (r + 16);
        const anchor = Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle";
        return (
          <text key={`t-${i}`} x={lx} y={ly} fill="currentColor" fontSize="10" textAnchor={anchor} dominantBaseline="middle" className="font-mono">
            {d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name}
          </text>
        );
      })}
    </svg>
  );
});
