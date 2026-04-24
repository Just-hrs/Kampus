import { memo, type ReactNode } from "react";

interface ModeBtnProps<T extends string> {
  id: T;
  current: T;
  onClick: (m: T) => void;
  icon: ReactNode;
  label: string;
}

function ModeBtnInner<T extends string>({ id, current, onClick, icon, label }: ModeBtnProps<T>) {
  const active = id === current;
  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={active}
      className="relative flex flex-col items-center gap-1 rounded-[var(--radius-2)] py-3 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{
        background: active ? "var(--grad-primary)" : "var(--surface)",
        color: active ? "white" : "var(--muted-foreground)",
        boxShadow: active ? "var(--glow-primary)" : undefined,
        border: "1px solid var(--border)",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export const ModeBtn = memo(ModeBtnInner) as typeof ModeBtnInner;
