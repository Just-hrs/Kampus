import { memo } from "react";
import { GRADE_COLORS, GRADE_POINTS } from "@/features/grades/logic";

interface GradeRingProps {
  grade: string | null;
  size?: number;
  stroke?: number;
}

/** Circular animated grade ring, color-coded by grade. */
export const GradeRing = memo(function GradeRing({ grade, size = 56, stroke = 5 }: GradeRingProps) {
  const points = grade && grade in GRADE_POINTS ? GRADE_POINTS[grade] : 0;
  const v = points / 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - v);
  const color = grade ? GRADE_COLORS[grade] : "var(--muted)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--muted)" strokeWidth={stroke} fill="none" opacity={0.25} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.32,0.72,0,1), stroke 300ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold" style={{ color }}>
        {grade ?? "—"}
      </div>
    </div>
  );
});
