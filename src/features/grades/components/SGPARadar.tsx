import { memo, useMemo } from "react";
import type { Semester,Settings } from "@/core/store";
import { calcSGPA } from "@/features/grades/logic";

interface SGPARadarProps {
  semesters: Semester[];
  totalSemesters: number;
  size?: number;
}

/** Radar chart comparing semester SGPAs */
export const SGPARadar = memo(function SGPARadar({
  semesters,
  totalSemesters,
  size = 260,
}: SGPARadarProps){
  const data = Array.from({ length: totalSemesters }, (_, i) => {
  const semNumber = i + 1;

  const sem = semesters.find((s) => s.number === semNumber);

  const sgpa = sem ? calcSGPA(sem) : 0;

  return {
    name: `S${semNumber}`,
    value: sgpa / 10,
    empty: !sem,
  };
});

  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-xs text-muted-foreground">
        Add at least 2 semesters to view SGPA radar.
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const n = data.length;

  const angle = (i: number) =>
    (Math.PI * 2 * i) / n - Math.PI / 2;

  const ring = (frac: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = angle(i);

      return `${cx + Math.cos(a) * r * frac},${
        cy + Math.sin(a) * r * frac
      }`;
    }).join(" ");

  const dataPoints = data
    .map((d, i) => {
      const a = angle(i);
      const rr = r * d.value;

      return `${cx + Math.cos(a) * rr},${
        cy + Math.sin(a) * rr
      }`;
    })
    .join(" ");

  return (
    <div className="rounded-3xl border border-border/40 bg-card/40 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">
          SGPA Radar
        </h3>

        <span className="text-xs text-muted-foreground">
          Semester comparison
        </span>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="SGPA radar"
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={ring(f)}
            fill="none"
            stroke="var(--border)"
            strokeOpacity={0.4}
            strokeWidth={1}
          />
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
          style={{
            filter: "drop-shadow(0 0 6px var(--primary))",
          }}
        />

        {data.map((d, i) => {
          const a = angle(i);
          const rr = r * d.value;

          return (
            <circle
              key={`p-${i}`}
              cx={cx + Math.cos(a) * rr}
              cy={cy + Math.sin(a) * rr}
              r={4}
              fill="var(--primary)"
            />
          );
        })}

        {data.map((d, i) => {
          const a = angle(i);

          const lx = cx + Math.cos(a) * (r + 16);
          const ly = cy + Math.sin(a) * (r + 16);

          const anchor =
            Math.cos(a) > 0.3
              ? "start"
              : Math.cos(a) < -0.3
              ? "end"
              : "middle";

          return (
            <text
              key={`t-${i}`}
              x={lx}
              y={ly}
              fill="currentColor"
              fontSize="10"
              textAnchor={anchor}
              dominantBaseline="middle"
              className="font-mono"
            >
              {d.name}
            </text>
          );
        })}
      </svg>
    </div>
  );
});