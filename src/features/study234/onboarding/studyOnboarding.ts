import { create } from "zustand";

type Intent =
  | "regular"
  | "procrastination"
  | "intense"
  | "tracking";

interface OnboardingState {
  step: 0 | 1 | 2 | 3;

  intent: Intent | null;
  declaredBehavior: string | null;

  realProfile: {
    startDelaySec: number;
    avgFocusSec: number;
    interruptionRate: number;
    sessionCount: number;
  } | null;

  setIntent: (i: Intent) => void;
  setDeclared: (b: string) => void;

  setRealProfile: (p: OnboardingState["realProfile"]) => void;
  nextStep: () => void;
  reset: () => void;
}

export const useStudyOnboarding = create<OnboardingState>((set) => ({
  step: 0,

  intent: null,
  declaredBehavior: null,

  realProfile: null,

  setIntent: (intent) => set({ intent }),
  setDeclared: (declaredBehavior) => set({ declaredBehavior }),

  setRealProfile: (realProfile) => set({ realProfile }),

  nextStep: () =>
    set((s) => ({ step: Math.min(3, (s.step + 1) as any) })),

  reset: () =>
    set({
      step: 0,
      intent: null,
      declaredBehavior: null,
      realProfile: null,
    }),
}));