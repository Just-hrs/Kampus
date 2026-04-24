/* StudentOS — Root Zustand store
 * Slices: grades, attendance, expenses, games, settings, streaks, ui
 * Persistence: IndexedDB via idb. Hydration is async and gated by useStore(s => s.hydrated).
 */
import { create } from "zustand";
import { idbGet, idbSet } from "@/core/storage/db";
import { debounce, uid } from "@/core/lib/utils";

// ============= Types =============
export type ThemeId = "neon" | "matte" | "pop" | "focus";
export type AttendanceStatus = "present" | "absent" | "cancelled";
export type ExpenseCategory =
  | "food"
  | "transport"
  | "vibes"
  | "books"
  | "subscriptions"
  | "coffee"
  | "misc";

export interface Subject {
  id: string;
  name: string;
  code?: string;
  credits: number;
  color: string; // hex/oklch token name
  startDateISO?: string;
  endDateISO?: string; // archived/ended after this date
}

export interface Semester {
  id: string;
  number: number; // 1..N
  name: string;
  subjects: Subject[];
  grades: Record<string, string | null>; // subjectId -> grade letter
  archived?: boolean;
}

export interface AttendanceRecord {
  // key: `${dateISO}_${subjectId}` -> status
  [key: string]: AttendanceStatus;
}

export interface DaySchedule {
  // weekday (0=Sun..6=Sat) -> subjectIds
  [day: number]: string[];
}

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  necessary: boolean;
  note?: string;
  dateISO: string; // YYYY-MM-DD
  createdAt: number;
}

export interface GameStats {
  // gameId -> { highScore, plays, lastPlayedISO }
  [gameId: string]: { highScore: number; plays: number; lastPlayedISO?: string };
}

export interface Settings {
  theme: ThemeId;
  haptics: boolean;
  sounds: boolean;
  notifications: boolean;
  totalSemesters: number;
  attendanceTarget: number; // percent, e.g. 75
  currency: "INR" | "USD" | "EUR";
  onboarded: boolean;
  studentName?: string;
}

export interface Streaks {
  current: number;
  longest: number;
  lastMarkISO?: string;
  graceUsedAt?: string; // ISO date
}

interface UISlice {
  // transient
  fabSheetOpen: null | "expense" | "grade" | "attendance";
}

export interface ExtraClass {
  id: string;
  dateISO: string;
  subjectId: string;
  time?: string; // HH:MM optional
}

export interface StudentOSState {
  hydrated: boolean;

  // Persisted slices
  semesters: Semester[];
  activeSemesterId: string | null;
  schedule: DaySchedule;
  attendance: AttendanceRecord;
  /** dateISO -> "holiday" (force off) or "working" (force class day) */
  holidayOverrides: Record<string, "holiday" | "working">;
  /** Ad-hoc one-time classes (Sundays, holidays, custom). */
  extraClasses: ExtraClass[];
  expenses: Expense[];
  monthlyBudget: number;
  games: GameStats;
  settings: Settings;
  streaks: Streaks;

  // UI
  ui: UISlice;

  // Actions
  setTheme: (t: ThemeId) => void;
  setSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: (data: {
    name?: string;
    theme: ThemeId;
    totalSemesters: number;
    target: number;
    subjects: Array<Pick<Subject, "name" | "credits">>;
    schedule: DaySchedule;
  }) => void;

  addSemester: () => void;
  setActiveSemester: (id: string | null) => void;
  setGrade: (semesterId: string, subjectId: string, grade: string | null) => void;
  addSubject: (semesterId: string, subject: Omit<Subject, "id">) => void;
  editSubject: (semesterId: string, subjectId: string, patch: Partial<Omit<Subject, "id">>) => void;
  removeSubject: (semesterId: string, subjectId: string) => void;
  endSubjectClasses: (semesterId: string, subjectId: string, dateISO: string) => void;

  setAttendance: (dateISO: string, subjectId: string, status: AttendanceStatus | null) => void;
  setSchedule: (day: number, subjectIds: string[]) => void;
  replaceSchedule: (next: DaySchedule) => void;

  setHolidayOverride: (dateISO: string, value: "holiday" | "working" | null) => void;
  addExtraClass: (e: Omit<ExtraClass, "id">) => void;
  removeExtraClass: (id: string) => void;

  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  removeExpense: (id: string) => void;
  setMonthlyBudget: (n: number) => void;

  recordGamePlay: (gameId: string, score: number) => void;

  bumpStreak: () => void;

  setFabSheet: (s: UISlice["fabSheetOpen"]) => void;

  exportData: () => Promise<string>;
  importData: (json: string) => Promise<boolean>;
  resetAll: () => void;
}

// ============= Defaults =============
const DEFAULT_SETTINGS: Settings = {
  theme: "neon",
  haptics: true,
  sounds: false,
  notifications: false,
  totalSemesters: 8,
  attendanceTarget: 75,
  currency: "INR",
  onboarded: false,
};

const DEFAULT_STREAKS: Streaks = { current: 0, longest: 0 };

const SUBJECT_COLORS = ["#a855f7", "#06b6d4", "#22d3ee", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#8b5cf6"];

function makeFirstSemester(): Semester {
  return {
    id: uid("sem"),
    number: 1,
    name: "Semester 1",
    subjects: [],
    grades: {},
  };
}

// ============= Store =============
export const useStore = create<StudentOSState>((set, get) => ({
  hydrated: false,
  semesters: [makeFirstSemester()],
  activeSemesterId: null,
  schedule: {},
  attendance: {},
  holidayOverrides: {},
  extraClasses: [],
  expenses: [],
  monthlyBudget: 5000,
  games: {},
  settings: DEFAULT_SETTINGS,
  streaks: DEFAULT_STREAKS,
  ui: { fabSheetOpen: null },

  setTheme: (t) => {
    set((s) => ({ settings: { ...s.settings, theme: t } }));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sos_theme", t);
        document.documentElement.classList.remove("theme-neon", "theme-matte", "theme-pop", "theme-focus");
        document.documentElement.classList.add(`theme-${t}`);
      } catch {
        /* ignore */
      }
    }
  },

  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  completeOnboarding: (data) => {
    const subjects: Subject[] = data.subjects.map((s, i) => ({
      id: uid("sub"),
      name: s.name,
      credits: s.credits,
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    }));
    const sem: Semester = {
      id: uid("sem"),
      number: 1,
      name: "Semester 1",
      subjects,
      grades: {},
    };
    // schedule references subject names → remap to ids by index order user picked
    const remappedSchedule: DaySchedule = {};
    for (const [day, ids] of Object.entries(data.schedule)) {
      const idArr = ids as string[];
      remappedSchedule[Number(day)] = idArr
        .map((nameOrId: string) => {
          const found = subjects.find((s) => s.id === nameOrId || s.name === nameOrId);
          return found?.id;
        })
        .filter((v: string | undefined): v is string => Boolean(v));
    }
    set((s) => ({
      semesters: [sem],
      activeSemesterId: sem.id,
      schedule: remappedSchedule,
      settings: {
        ...s.settings,
        theme: data.theme,
        totalSemesters: data.totalSemesters,
        attendanceTarget: data.target,
        studentName: data.name,
        onboarded: true,
      },
    }));
    get().setTheme(data.theme);
  },

  addSemester: () =>
    set((s) => {
      const next = s.semesters.length + 1;
      return {
        semesters: [
          ...s.semesters,
          { id: uid("sem"), number: next, name: `Semester ${next}`, subjects: [], grades: {} },
        ],
      };
    }),

  setActiveSemester: (id) => set({ activeSemesterId: id }),

  setGrade: (semesterId, subjectId, grade) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId ? { ...sem, grades: { ...sem.grades, [subjectId]: grade } } : sem,
      ),
    })),

  addSubject: (semesterId, subject) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: [
                ...sem.subjects,
                {
                  ...subject,
                  id: uid("sub"),
                  color: subject.color || SUBJECT_COLORS[sem.subjects.length % SUBJECT_COLORS.length],
                },
              ],
            }
          : sem,
      ),
    })),

  removeSubject: (semesterId, subjectId) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.filter((sub) => sub.id !== subjectId),
              grades: Object.fromEntries(Object.entries(sem.grades).filter(([k]) => k !== subjectId)),
            }
          : sem,
      ),
    })),

  editSubject: (semesterId, subjectId, patch) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((sub) =>
                sub.id === subjectId ? { ...sub, ...patch } : sub,
              ),
            }
          : sem,
      ),
    })),

  endSubjectClasses: (semesterId, subjectId, dateISO) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((sub) =>
                sub.id === subjectId ? { ...sub, endDateISO: dateISO } : sub,
              ),
            }
          : sem,
      ),
    })),

  setAttendance: (dateISO, subjectId, status) =>
    set((s) => {
      const key = `${dateISO}_${subjectId}`;
      const next = { ...s.attendance };
      if (status === null) delete next[key];
      else next[key] = status;
      return { attendance: next };
    }),

  setSchedule: (day, subjectIds) =>
    set((s) => ({ schedule: { ...s.schedule, [day]: subjectIds } })),

  replaceSchedule: (next) => set({ schedule: next }),

  setHolidayOverride: (dateISO, value) =>
    set((s) => {
      const next = { ...s.holidayOverrides };
      if (value === null) delete next[dateISO];
      else next[dateISO] = value;
      return { holidayOverrides: next };
    }),

  addExtraClass: (e) =>
    set((s) => ({ extraClasses: [...s.extraClasses, { ...e, id: uid("xc") }] })),

  removeExtraClass: (id) =>
    set((s) => ({ extraClasses: s.extraClasses.filter((x) => x.id !== id) })),

  addExpense: (e) =>
    set((s) => ({
      expenses: [{ ...e, id: uid("exp"), createdAt: Date.now() }, ...s.expenses],
    })),

  removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

  setMonthlyBudget: (n) => set({ monthlyBudget: n }),

  recordGamePlay: (gameId, score) =>
    set((s) => {
      const prev = s.games[gameId] ?? { highScore: 0, plays: 0 };
      return {
        games: {
          ...s.games,
          [gameId]: {
            highScore: Math.max(prev.highScore, score),
            plays: prev.plays + 1,
            lastPlayedISO: new Date().toISOString().slice(0, 10),
          },
        },
      };
    }),

  bumpStreak: () =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10);
      if (s.streaks.lastMarkISO === today) return {};
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const continuing = s.streaks.lastMarkISO === yesterday;
      const current = continuing ? s.streaks.current + 1 : 1;
      return {
        streaks: {
          ...s.streaks,
          current,
          longest: Math.max(s.streaks.longest, current),
          lastMarkISO: today,
        },
      };
    }),

  setFabSheet: (v) => set((s) => ({ ui: { ...s.ui, fabSheetOpen: v } })),

  exportData: async () => {
    const { semesters, activeSemesterId, schedule, attendance, holidayOverrides, extraClasses, expenses, monthlyBudget, games, settings, streaks } =
      get();
    return JSON.stringify(
      { schemaVersion: 2, semesters, activeSemesterId, schedule, attendance, holidayOverrides, extraClasses, expenses, monthlyBudget, games, settings, streaks },
      null,
      2,
    );
  },

  importData: async (json) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object") return false;
      set({
        semesters: parsed.semesters ?? [makeFirstSemester()],
        activeSemesterId: parsed.activeSemesterId ?? null,
        schedule: parsed.schedule ?? {},
        attendance: parsed.attendance ?? {},
        holidayOverrides: parsed.holidayOverrides ?? {},
        extraClasses: parsed.extraClasses ?? [],
        expenses: parsed.expenses ?? [],
        monthlyBudget: parsed.monthlyBudget ?? 5000,
        games: parsed.games ?? {},
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        streaks: parsed.streaks ?? DEFAULT_STREAKS,
      });
      return true;
    } catch {
      return false;
    }
  },

  resetAll: () =>
    set({
      semesters: [makeFirstSemester()],
      activeSemesterId: null,
      schedule: {},
      attendance: {},
      holidayOverrides: {},
      extraClasses: [],
      expenses: [],
      monthlyBudget: 5000,
      games: {},
      settings: DEFAULT_SETTINGS,
      streaks: DEFAULT_STREAKS,
    }),
}));

// ============= Hydration + Auto-persist =============
const PERSIST_KEYS = [
  "semesters",
  "activeSemesterId",
  "schedule",
  "attendance",
  "holidayOverrides",
  "extraClasses",
  "expenses",
  "monthlyBudget",
  "games",
  "settings",
  "streaks",
] as const;

let hydrating = false;

export async function hydrateStore() {
  if (typeof window === "undefined") return;
  if (hydrating) return;
  hydrating = true;
  try {
    const updates: Partial<StudentOSState> = {};
    for (const k of PERSIST_KEYS) {
      const v = await idbGet<unknown>("settings", k);
      if (v !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (updates as any)[k] = v;
      }
    }
    useStore.setState({ ...updates, hydrated: true });

    // Apply theme class on load (also handled by inline script for no-flash, but ensure consistency)
    const theme = (updates.settings as Settings | undefined)?.theme ?? "neon";
    document.documentElement.classList.remove("theme-neon", "theme-matte", "theme-pop", "theme-focus");
    document.documentElement.classList.add(`theme-${theme}`);
  } catch {
    useStore.setState({ hydrated: true });
  }
}

const persist = debounce(((state: StudentOSState) => {
  for (const k of PERSIST_KEYS) {
    void idbSet("settings", k, state[k]);
  }
}) as (...args: unknown[]) => void, 250);

export function startPersistence() {
  if (typeof window === "undefined") return;
  useStore.subscribe((state) => {
    if (!state.hydrated) return;
    persist(state);
  });
}
