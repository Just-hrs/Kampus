import { memo } from "react";

interface SemPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  sgpa?: number;
}

export const SemPill = memo(function SemPill({ label, active, onClick, sgpa }: SemPillProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex h-12 shrink-0 flex-col items-center justify-center rounded-2xl px-4 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active ? "text-primary-foreground" : "surface-glass text-foreground"
      }`}
      style={
        active
          ? { background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }
          : undefined
      }
    >
      <span className="text-[10px] uppercase tracking-wider opacity-80">{label}</span>
      {sgpa !== undefined && sgpa > 0 && (
        <span className="font-display text-sm font-bold leading-none">{sgpa.toFixed(2)}</span>
      )}
    </button>
  );
});
