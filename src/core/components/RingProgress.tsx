interface RingProgressProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  glow?: boolean;
}

export function RingProgress({
  value,
  size = 120,
  stroke = 10,
  color = "var(--primary)",
  trackColor = "var(--muted)",
  children,
  glow = true,
}: RingProgressProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const v = Math.max(0, Math.min(1, value));
  const offset = circ * (1 - v);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ filter: glow ? "drop-shadow(0 0 8px var(--primary))" : undefined }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
          opacity={0.3}
        />
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
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.32, 0.72, 0, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
