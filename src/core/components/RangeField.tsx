import { useId, type ReactNode } from "react";

interface RangeFieldProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  className?: string;
}

/** Accessible labeled range input with consistent styling. */
export function RangeField({ label, value, min, max, step = 1, onChange, className }: RangeFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--primary)]"
      />
    </div>
  );
}
