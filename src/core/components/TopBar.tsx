import { Link, useLocation } from "@tanstack/react-router";
import { Flame, Settings as SettingsIcon, Gamepad2 } from "lucide-react";
import { useStore } from "@/core/store";
import { useHydrated } from "@/core/hooks/useHydrated";
import { timeOfDayGreeting } from "@/core/lib/utils";

const TITLES: Record<string, string> = {
  "/": "StudentOS",
  "/grades": "Grades",
  "/attendance": "Attendance",
  "/expenses": "Expenses",
  "/insights": "Insights",
  "/games": "Game Center",
  "/settings": "Settings",
};

export function TopBar() {
  const loc = useLocation();
  const hydrated = useHydrated();
  const streak = useStore((s) => s.streaks.current);
  const name = useStore((s) => s.settings.studentName);

  const title =
    loc.pathname === "/"
      ? hydrated && name
        ? `${timeOfDayGreeting()}, ${name.split(" ")[0]}`
        : "StudentOS"
      : (TITLES[loc.pathname] ?? "");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 px-4 md:pl-20">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        {hydrated && streak > 0 && (
          <div className="surface-glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
            <Flame size={14} className="text-warning" style={{ filter: "drop-shadow(0 0 4px var(--warning))" }} />
            <span className="font-mono">{streak}</span>
          </div>
        )}
        <Link
          to="/games"
          className="surface-glass flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Game Center"
        >
          <Gamepad2 size={16} />
        </Link>
        <Link
          to="/settings"
          className="surface-glass flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Settings"
        >
          <SettingsIcon size={16} />
        </Link>
      </div>
    </header>
  );
}
