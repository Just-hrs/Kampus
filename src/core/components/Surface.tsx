import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SurfaceProps {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "flat" | "raised";
  onClick?: () => void;
  as?: "div" | "button";
}

export function Surface({ children, className, variant = "flat", onClick, as = "div" }: SurfaceProps) {
  const base =
    variant === "glass"
      ? "surface-glass"
      : variant === "flat"
        ? "bg-card border border-border"
        : "bg-card border border-border shadow-[var(--shadow-md)]";
  const Comp = as;
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-3)] text-card-foreground",
        base,
        onClick && "transition-transform active:scale-[0.98] cursor-pointer",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
