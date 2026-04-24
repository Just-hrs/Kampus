import { motion } from "framer-motion";

interface ToggleProps {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, on, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      <span className="text-sm">{label}</span>
      <span
        className="relative h-6 w-11 rounded-full transition-colors"
        style={{ background: on ? "var(--primary)" : "var(--muted)" }}
      >
        <motion.span
          animate={{ x: on ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
        />
      </span>
    </button>
  );
}
