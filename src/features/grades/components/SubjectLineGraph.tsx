import { memo, useMemo } from "react";
import type { Semester } from "@/core/store";
import { GRADE_POINTS } from "@/features/grades/logic";

interface SubjectLineGraphProps {
  semester: Semester;
}

/** Simple line graph of grade points per subject. */
export const SubjectLineGraph = memo(function SubjectLineGraph({ semester }: SubjectLineGraphProps) {
  const data = useMemo(
    () =>
      semester.subjects.map((sub) => {
        const g = semester.grades[sub.id];
        return { name: sub.name, value: g && g in GRADE_POINTS ? GRADE_POINTS[g] : 0, color: sub.color };
      }),
    [semester],
  );

  if (data.length === 0) {
    return <div className="py-6 text-center text-xs text-muted-foreground">No subjects yet.</div>;
  }

  const w = 320;
  const h = 140;
  const pad = 24;
  const xStep = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const yMap = (v: number) => h - pad - ((v / 10) * (h - pad * 2));

  const points = data.map((d, i) => `${pad + i * xStep},${yMap(d.value)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Subject grade trend">
      {[2, 4, 6, 8].map((v) => (
        <line key={v} x1={pad} y1={yMap(v)} x2={w - pad} y2={yMap(v)} stroke="var(--border)" strokeOpacity={0.25} strokeDasharray="2 4" />
      ))}
      {data.length > 1 && (
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 4px var(--primary))" }}
        />
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pad + i * xStep} cy={yMap(d.value)} r={4} fill={d.color} />
          <text x={pad + i * xStep} y={h - 6} fontSize="9" textAnchor="middle" fill="currentColor" className="font-mono opacity-70">
            {d.name.slice(0, 5)}
          </text>
        </g>
      ))}
    </svg>
  );
});
