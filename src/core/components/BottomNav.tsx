import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, GraduationCap, CalendarCheck, Wallet, Sparkles, Gamepad2 } from "lucide-react";import { useHaptics } from "@/core/hooks/useHaptics";
import { motion } from "framer-motion";

const TABS = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/grades", label: "Grades", icon: GraduationCap },
  { to: "/attendance", label: "Attend", icon: CalendarCheck },
  { to: "/expenses", label: "Spend", icon: Wallet },
  { to: "/games", label: "Games", icon: Gamepad2 }, // 🔥 added
] as const;

export function BottomNav() {
  const haptic = useHaptics();
  const loc = useLocation();
  return (
    <nav
      className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 surface-glass rounded-full px-2 py-2 shadow-[var(--shadow-lg)] md:hidden"
      style={{ maxWidth: "calc(100vw - 24px)" }}
    >
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(tab.to);
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                onClick={() => haptic("tick")}
                className="relative flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-muted-foreground transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="bn-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1.5 ${active ? "text-primary-foreground" : ""}`}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                  {active && <span className="text-xs font-semibold">{tab.label}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
