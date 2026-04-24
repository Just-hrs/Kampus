import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SideRail } from "./SideRail";
import { useStore, hydrateStore, startPersistence } from "@/core/store";
import { useHydrated } from "@/core/hooks/useHydrated";

export function AppShell({ children }: { children?: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const onboarded = useStore((s) => s.settings.onboarded);
  const storeReady = useStore((s) => s.hydrated);

  useEffect(() => {
    void hydrateStore().then(() => startPersistence());
  }, []);

  useEffect(() => {
    if (!hydrated || !storeReady) return;
    if (!onboarded && loc.pathname !== "/onboarding") {
      void navigate({ to: "/onboarding" });
    }
  }, [hydrated, storeReady, onboarded, loc.pathname, navigate]);

  const isOnboarding = loc.pathname === "/onboarding";

  return (
    <div className="relative min-h-svh text-foreground">
      <div className="aurora-bg" />
      <div className="relative z-10 flex min-h-svh flex-col">
        {!isOnboarding && <TopBar />}
        {!isOnboarding && <SideRail />}
        <main className="flex-1 pb-24 md:pl-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
        {!isOnboarding && <BottomNav />}
      </div>
    </div>
  );
}
