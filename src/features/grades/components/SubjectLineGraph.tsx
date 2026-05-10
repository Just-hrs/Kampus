import { memo, useMemo } from "react";
import type { Semester } from "@/core/store";
import { GRADE_POINTS } from "@/features/grades/logic";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SubjectLineGraphProps {
  semester: Semester;
}

/** Lightweight responsive subject performance graph */
export const SubjectLineGraph = memo(function SubjectLineGraph({
  semester,
}: SubjectLineGraphProps) {
  const data = useMemo(
    () =>
      semester.subjects.map((sub) => {
        const grade = semester.grades[sub.id];

        return {
          short:
            sub.name.length > 6
              ? sub.name.slice(0, 6)
              : sub.name,
          full: sub.name,
          value:
            grade && grade in GRADE_POINTS
              ? GRADE_POINTS[grade]
              : null,
        };
      }),
    [semester],
  );

  if (data.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-muted-foreground">
        No subjects yet.
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height={208}>
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 12,
            left: 6,
            bottom: 0,
          }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.15}
          />

          <XAxis
            dataKey="short"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            fontSize={10}
          />

          <YAxis
            domain={[0, 10]}
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            fontSize={10}
            width={28}
          />

          <Tooltip
            isAnimationActive={false}
            cursor={{
              stroke: "var(--primary)",
              strokeOpacity: 0.25,
            }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) => [
              `${value}/10`,
              "Grade",
            ]}
            labelFormatter={(label) => {
              const item = data.find(
                (d) => d.short === label,
              );

              return item?.full ?? label;
            }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2.5}
            connectNulls={false}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 5,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});