import { Surface } from "@/core/components/Surface";
import type { sgpaTrend } from "@/features/grades/logic";

interface SGPAChartProps {
  trend: ReturnType<typeof sgpaTrend>;
}

export function SGPAChart({ trend }: SGPAChartProps) {
  const w = 320;
  const h = 140;
  const pad = 16;
  const max = 10;
  const xStep = trend.length > 1 ? (w - pad * 2) / (trend.length - 1) : 0;

  const sgpaPoints = trend
    .map((d, i) => `${pad + i * xStep},${h - pad - (d.sgpa / max) * (h - pad * 2)}`)
    .join(" ");
  const cgpaPoints = trend
    .map((d, i) => `${pad + i * xStep},${h - pad - (d.cgpa / max) * (h - pad * 2)}`)
    .join(" ");

  return (
    <Surface className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          SGPA · CGPA Trend
        </div>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" /> SGPA
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" /> CGPA
          </span>
        </div>
      </div>
      {trend.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No graded semesters yet.
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto"
          role="img"
          aria-label="SGPA and CGPA trend across semesters"
        >
          {[2, 4, 6, 8].map((v) => (
            <line
              key={v}
              x1={pad}
              x2={w - pad}
              y1={h - pad - (v / max) * (h - pad * 2)}
              y2={h - pad - (v / max) * (h - pad * 2)}
              stroke="var(--border)"
              strokeDasharray="2 4"
            />
          ))}
          <polyline
            points={cgpaPoints}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polyline
            points={sgpaPoints}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px var(--primary))" }}
          />
          {trend.map((d, i) => (
            <g key={i}>
              <circle
                cx={pad + i * xStep}
                cy={h - pad - (d.sgpa / max) * (h - pad * 2)}
                r="3"
                fill="var(--primary)"
              />
              <text
                x={pad + i * xStep}
                y={h - 4}
                textAnchor="middle"
                fontSize="9"
                fill="var(--muted-foreground)"
                fontFamily="var(--font-mono)"
              >
                S{d.semNumber}
              </text>
            </g>
          ))}
        </svg>
      )}
    </Surface>
  );
}
