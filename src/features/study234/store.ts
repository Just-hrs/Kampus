import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Mood, StudyModeId, StudySession } from "./types";

interface StudyState {
  selectedModeId: StudyModeId;
  sessions: StudySession[];
  lastActiveAt: number | null;
  setMode: (id: StudyModeId) => void;
  addSession: (s: Omit<StudySession, "id">) => string;
  setMood: (sessionId: string, mood: Mood) => void;
  touch: () => void;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set) => ({
      selectedModeId: "deep-focus",
      sessions: [],
      lastActiveAt: null,
      setMode: (id) => set({ selectedModeId: id }),
      addSession: (s) => {
        const id = `${s.startedAt}-${Math.random().toString(36).slice(2, 7)}`;
        set((st) => ({
          sessions: [...st.sessions, { ...s, id }],
          lastActiveAt: Date.now(),
        }));
        return id;
      },
      setMood: (sessionId, mood) =>
        set((st) => ({
          sessions: st.sessions.map((x) =>
            x.id === sessionId ? { ...x, mood } : x,
          ),
        })),
      touch: () => set({ lastActiveAt: Date.now() }),
    }),
    {
      name: "study-store-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (undefined as never),
      ),
      partialize: (s) => ({
        selectedModeId: s.selectedModeId,
        sessions: s.sessions,
        lastActiveAt: s.lastActiveAt,
      }),
    },
  ),
);
