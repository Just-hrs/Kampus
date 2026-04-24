import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, GraduationCap, CalendarCheck, Wallet, Sparkles, Gamepad2, Settings } from "lucide-react";
import { motion } from "framer-motion";

const TABS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/grades", label: "Grades", icon: GraduationCap },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/games", label: "Games", icon: Gamepad2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SideRail() {
  const loc = useLocation();
  return (
    <aside className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 md:block">
      <nav className="surface-glass flex flex-col gap-1 rounded-full p-2 shadow-[var(--shadow-lg)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className="group relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors"
              title={t.label}
            >
              {active && (
                <motion.span
                  layoutId="sr-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--grad-primary)", boxShadow: "var(--glow-primary)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon size={20} className={`relative z-10 ${active ? "text-primary-foreground" : ""}`} />
              <span className="pointer-events-none absolute left-12 hidden whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block">
                {t.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
