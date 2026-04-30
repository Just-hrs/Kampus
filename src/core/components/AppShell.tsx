import {useEffect,useRef,type ReactNode,} from "react";
import {Outlet,useLocation,useNavigate,} from "@tanstack/react-router";
import {AnimatePresence,motion,} from "framer-motion";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SideRail } from "./SideRail";
import {useStore,hydrateStore,startPersistence,} from "@/core/store";
import { useHydrated } from "@/core/hooks/useHydrated";
import { App } from "@capacitor/app";
import { loadAnalyticsUsers } from "@/core/analytics/adminLoader";
export function AppShell({
    children,
  }: {
    children?: ReactNode;
  }) {
    const loc = useLocation();
    const navigate = useNavigate();

    const hydrated = useHydrated();

    const onboarded = useStore(
      (s) => s.settings.onboarded
    );

    const storeReady = useStore(
      (s) => s.hydrated
    );
    // ================= ANALYTICS ACTIONS =================
    // const initializeAnalytics = useStore(
    //   (s) => s.initializeAnalytics
    // );

    // const startSession = useStore(
    //   (s) => s.startSession
    // );

    // const trackScreenEnter = useStore(
    //   (s) => s.trackScreenEnter
    // );

    // const trackScreenExit = useStore(
    //   (s) => s.trackScreenExit
    // );
    // const finalizeSession = useStore(
    //   (s) => s.finalizeSession
    // );

    // ================= STRICTMODE GUARDS =================
    // Prevent duplicate session creation in React 19 dev mode
    const sessionStartedRef = useRef(false);

    // Track previous route safely
    const previousPathRef = useRef<string | null>(
      null
    );

    // ================= STORE INIT =================
    const analyticsBooted =
      useRef(false);
    
    useEffect(() => {
      if (analyticsBooted.current) {
        return;
      }
      analyticsBooted.current = true;
      void hydrateStore().then(async () => {
        startPersistence();

        // permanent install identity
        //await initializeAnalytics();
        
        // // finalize old days first
        // await useStore
        //   .getState()
        //   .rolloverAnalyticsDay();

        // start fresh runtime session
        //startSession();
        // try {
        //   const analyticsUsers =
        //     await loadAnalyticsUsers();

        //   console.log(
        //     "[ADMIN USERS]",
        //     analyticsUsers
        //   );

        // } catch (err) {

        //   console.error(
        //     "[ADMIN LOAD FAILED]",
        //     err
        //   );
        // }
        // // uploader listener
        // useStore
        // .getState()
        // .startAnalyticsUploader();
      });
    }, []);

    // ================= START SESSION =================
    // useEffect(() => {
    //   if (!hydrated || !storeReady) return;

    //   // Prevent duplicate sessions
    //   if (sessionStartedRef.current) return;

    //   sessionStartedRef.current = true;

    //   startSession();
    // }, [
    //   hydrated,
    //   storeReady,
    //   startSession,
    // ]);

    // useEffect(() => {
    //   const handleHidden = () => {

    //     if (
    //       document.visibilityState ===
    //       "hidden"
    //     ) {
    //       finalizeSession();
    //     }
    //   };

    //   const handleUnload = () => {
    //     finalizeSession();
    //   };

    //   document.addEventListener(
    //     "visibilitychange",
    //     handleHidden
    //   );

    //   window.addEventListener(
    //     "beforeunload",
    //     handleUnload
    //   );

    //   return () => {
    //     document.removeEventListener(
    //       "visibilitychange",
    //       handleHidden
    //     );

    //     window.removeEventListener(
    //       "beforeunload",
    //       handleUnload
    //     );
    //   };
    // }, [finalizeSession]);

    // ================= ONBOARDING GUARD =================
    
    useEffect(() => {
      if (!hydrated || !storeReady) return;

      if (
        !onboarded &&
        loc.pathname !== "/onboarding"
      ) {
        void navigate({
          to: "/onboarding",
        });
      }
    }, [
      hydrated,
      storeReady,
      onboarded,
      loc.pathname,
      navigate,
    ]);

    // ================= SCREEN ANALYTICS =================
    // useEffect(() => {
    //   if (!hydrated || !storeReady) return;

    //   const currentPath = loc.pathname;

    //   const previousPath =
    //     previousPathRef.current;

    //   // Exit previous screen FIRST
    //   if (previousPath) {
    //     trackScreenExit(previousPath);
    //   }

    //   // Enter current screen
    //   trackScreenEnter(currentPath);

    //   // Save latest route
    //   previousPathRef.current = currentPath;
    // }, [
    //   loc.pathname,
    //   hydrated,
    //   storeReady,
    //   trackScreenEnter,
    //   trackScreenExit,
    // ]);

    // ================= APP BACKGROUND HANDLING =================
    // useEffect(() => {
    //   let lastKnownScreen: string | null = null;

    //   const listener = App.addListener(
    //     "appStateChange",
    //     ({ isActive }) => {
    //       const current =
    //         previousPathRef.current;

    //       if (!current) return;

    //       // app moved to background
    //       if (!isActive) {
    //         lastKnownScreen = current;

    //         trackScreenExit(current);
    //       }

    //       // app restored
    //       if (isActive && lastKnownScreen) {
    //         trackScreenEnter(lastKnownScreen);
    //       }
    //     }
    //   );

    //   return () => {
    //     void listener.then((l) => l.remove());
    //   };
    // }, [
    //   trackScreenEnter,
    //   trackScreenExit,
    // ]);
    // ================= FINAL CLEANUP =================
    // useEffect(() => {
    //   return () => {
    //     const current =
    //       previousPathRef.current;

    //     if (current) {
    //       trackScreenExit(current);
    //     }

    //     finalizeSession();
    //   };
    // }, [
    //   trackScreenExit,
    //   finalizeSession,
    // ]);

    const isOnboarding =
      loc.pathname === "/onboarding";

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
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.22,
                  ease: [0.32, 0.72, 0, 1],
                }}
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

