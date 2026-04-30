/* StudentOS — Root Zustand store
 * Slices: grades, attendance, expenses, games, settings, streaks, ui
 * Persistence: IndexedDB via idb. Hydration is async and gated by useStore(s => s.hydrated).
 */
import { create } from "zustand";
import { idbGet, idbSet } from "@/core/storage/db";
import { debounce, uid } from "@/core/lib/utils";

// import { enqueueAnalytics, flushAnalyticsQueue } from "@/core/analytics/uploadQueue";
// import { sendToFirebase } from "@/core/analytics/firebaseSender";
// import { getInstallId } from "@/core/analytics/device";
// import { encodeAnalyticsPacket }from "@/core/analytics/encoder";


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

export interface AnalyticsState {
  installId: string | null;

  sessionId: string | null;

  sessionStart: number | null;

  lastActive: number | null;

  currentScreen: string | null;

  pages: Record<
    string,
    {
      visits: number;
      totalTime: number;
      maxSingleVisit: number;

      // runtime only
      _lastEnter?: number;
    }
  >;

  games: Record<
    string,
    {
      visits: number;
      totalTime: number;
      maxSingleVisit: number;

      _lastEnter?: number;
    }
  >;

  daily: Record<
    string,
    {
      totalTime: number;
      sessions: number;

      uploaded?: boolean;
      uploading?: boolean;
      finalized?: boolean;

      pages: Record<
        string,
        {
          visits: number;
          totalTime: number;
        }
      >;

      games: Record<
        string,
        {
          visits: number;
          totalTime: number;
        }
      >;
    }
  >;
}

export interface AnalyticsProfileState {
  dirty: boolean;

  lastSnapshotDate: string | null;

  pendingProfile: {
    studentName?: string;

    semesters: Array<{
      id: string;
      number: number;
      name: string;

      subjects: Array<{
        id: string;
        name: string;
        credits: number;
      }>;
    }>;
  } | null;
}

export interface PendingAnalyticsPacket {
  date: string;

  behavior: {
    sessions: number;
    totalTime: number;

    pages: Record<
      string,
      {
        visits: number;
        totalTime: number;
      }
    >;
  };

  profile?: {
    studentName?: string;

    semesters: Array<{
      id: string;
      number: number;
      name: string;

      subjects: Array<{
        id: string;
        name: string;
        credits: number;
      }>;
    }>;
  };

  games?: Record<
    string,
    {
      visits: number;
      totalTime: number;
    }
  >;
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
  currentSemesterId: string | null;
  // UI
  ui: UISlice;
/////////////////////////////////////////////////////////////////////////////////////////
  startSession: () => void;
  initializeAnalytics: () => Promise<void>;
  finalizeSession: () => void;
  trackScreenEnter: (screen: string) => void;
  trackScreenExit: (screen: string) => void;
  trackGameEnter: (gameId: string) => void;
  trackGameExit: (gameId: string) => void;
  startAnalyticsUploader: () => void;
  markProfileDirty: () => void;
  buildProfileSnapshot: () => void;
  clearProfileDirty: () => void;
  buildDailyAnalyticsPacket: ( date: string) => void;
  clearAnalyticsDay: (date: string) => void;
  rolloverAnalyticsDay: () => Promise<void>;
  analytics: AnalyticsState;
  profileAnalytics: AnalyticsProfileState;
  pendingAnalyticsPackets: PendingAnalyticsPacket[];


//////////////////////////////////////////////////////////////////////////////////
  // Actions
  setTheme: (t: ThemeId) => void;
  setSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: (data: {
    name?: string;
    theme: ThemeId;
    totalSemesters: number;
    currentSemester: number; // 🔥 ADD
    target: number;
    subjects: Array<Pick<Subject, "name" | "credits">>;
    schedule: DaySchedule;
  }) => void;

  addSemester: () => void;
  deleteLastSemester: () => void;
  setActiveSemester: (id: string | null) => void;
  setCurrentSemester: (id: string | null) => void;
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
  attendanceTarget: 70,
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

function cleanupOldAnalyticsDays(
  daily: AnalyticsState["daily"],
  keepDays = 60
): AnalyticsState["daily"] {

  const entries =
    Object.entries(daily);

  const sorted =
    entries.sort((a, b) =>
      a[0].localeCompare(b[0])
    );

  if (
    sorted.length <= keepDays
  ) {
    return daily;
  }

  const trimmed =
    sorted.slice(-keepDays);

  return Object.fromEntries(
    trimmed
  );
}

// ============= Store =============
export const useStore = create<StudentOSState>((set, get) => ({
  hydrated: false,

  semesters: [makeFirstSemester()],
  activeSemesterId: null,
  currentSemesterId: null,

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

  analytics: {
    installId: null,
    sessionId: null,
    sessionStart: null,
    lastActive: null,
    currentScreen: null,
    pages: {},
    games: {},
    daily: {},
  },

  profileAnalytics: {
    dirty: false,
    lastSnapshotDate: null,
    pendingProfile: null,
  },

  pendingAnalyticsPackets: [],

   // ================= THEME =================
  setTheme: (t) => {
    set((s) => ({ settings: { ...s.settings, theme: t } }));

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sos_theme", t);
        document.documentElement.classList.remove(
          "theme-neon",
          "theme-matte",
          "theme-pop",
          "theme-focus",
        );
        document.documentElement.classList.add(`theme-${t}`);
      } catch {}
    }
  },

  setSettings: (patch) =>
    set((s) => {
      const nameChanged =
        patch.studentName !== undefined &&
        patch.studentName !== s.settings.studentName;

      return {
        settings: {
          ...s.settings,
          ...patch,
        },

        ...(nameChanged
          ? {
              profileAnalytics: {
                ...s.profileAnalytics,
                dirty: true,
              },
            }
          : {}),
      };
  }),
  // ================= ONBOARDING =================
  completeOnboarding: (data) => {
    const subjects: Subject[] = data.subjects.map((s, i) => ({
      id: uid("sub"),
      name: s.name,
      credits: s.credits,
      color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
    }));

    // 🔥 CREATE FULL SEMESTER STACK
    const currentSemesterNumber = data.currentSemester;

    const semesters: Semester[] = Array.from(
      { length: currentSemesterNumber },
      (_, i) => ({
        id: uid("sem"),
        number: i + 1,
        name: `Semester ${i + 1}`,
        subjects: i === 0 ? subjects : [],
        grades: {},
      })
    );

    const remappedSchedule: DaySchedule = {};
    for (const [day, ids] of Object.entries(data.schedule)) {
      const idArr = ids as string[];

      remappedSchedule[Number(day)] = idArr
        .map((nameOrId) => {
          const found = subjects.find(
            (s) => s.id === nameOrId || s.name === nameOrId
          );
          return found?.id;
        })
        .filter(Boolean) as string[];
    }

    set((s) => ({
      semesters,

      activeSemesterId: semesters[currentSemesterNumber - 1].id,
      currentSemesterId: semesters[currentSemesterNumber - 1].id,

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

  // ================= SEMESTERS =================
  addSemester: () =>
  set((s) => {
    const max = s.settings.totalSemesters;

    // 🚫 stop if limit reached
    if (s.semesters.length >= max) return s;

    const next = s.semesters.length + 1;

    const newSem = {
      id: uid("sem"),
      number: next,
      name: `Semester ${next}`,
      subjects: [],
      grades: {},
    };

    return {
      semesters: [...s.semesters, newSem],
      currentSemesterId: newSem.id, // move forward
    };
  }),

  deleteLastSemester: () =>
    set((s) => {
      if (s.semesters.length <= 1) return s; // don't delete last remaining

      const updated = s.semesters.slice(0, -1);
      const newCurrent = updated[updated.length - 1];

      return {
        semesters: updated,
        currentSemesterId: newCurrent.id, // shift back
      };
    }),

  setActiveSemester: (id) => set({ activeSemesterId: id }),

  // 🔥 FIXED: this was missing proper implementation earlier in your typing confusion
  setCurrentSemester: (id) => set({ currentSemesterId: id }),

  // ================= SUBJECTS =================
  setGrade: (semesterId, subjectId, grade) =>
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? { ...sem, grades: { ...sem.grades, [subjectId]: grade } }
          : sem,
      ),
    })),

  addSubject: (semesterId, subject) => {
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
                  color:
                    subject.color ||
                    SUBJECT_COLORS[
                      sem.subjects.length % SUBJECT_COLORS.length
                    ],
                },
              ],
            }
          : sem,
      ),
    }));

    get().markProfileDirty();
  },

  removeSubject: (semesterId, subjectId) => {
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.filter(
                (sub) => sub.id !== subjectId
              ),

              grades: Object.fromEntries(
                Object.entries(sem.grades).filter(
                  ([k]) => k !== subjectId
                ),
              ),
            }
          : sem,
      ),
    })),
    get().markProfileDirty();
  },

  editSubject: (semesterId, subjectId, patch) => {
    set((s) => ({
      semesters: s.semesters.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              subjects: sem.subjects.map((sub) =>
                sub.id === subjectId
                  ? { ...sub, ...patch }
                  : sub,
              ),
            }
          : sem,
      ),
    })),
    get().markProfileDirty();
},

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

  // ================= ATTENDANCE =================
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

  // ================= HOLIDAY =================
  setHolidayOverride: (dateISO, value) =>
    set((s) => {
      const next = { ...s.holidayOverrides };

      if (value === null) delete next[dateISO];
      else next[dateISO] = value;

      return { holidayOverrides: next };
    }),

  // ================= EXTRAS =================
  addExtraClass: (e) =>
    set((s) => ({
      extraClasses: [...s.extraClasses, { ...e, id: uid("xc") }],
    })),

  removeExtraClass: (id) =>
    set((s) => ({
      extraClasses: s.extraClasses.filter((x) => x.id !== id),
    })),

  // ================= EXPENSES =================
  addExpense: (e) =>
    set((s) => ({
      expenses: [
        { ...e, id: uid("exp"), createdAt: Date.now() },
        ...s.expenses,
      ],
    })),

  removeExpense: (id) =>
    set((s) => ({
      expenses: s.expenses.filter((e) => e.id !== id),
    })),

  setMonthlyBudget: (n) => set({ monthlyBudget: n }),

  // ================= GAMES =================
  recordGamePlay: (gameId, score) =>
    set((s) => {
      const prev = s.games[gameId] ?? {
        highScore: 0,
        plays: 0,
      };

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

  // ================= STREAKS =================
  bumpStreak: () =>
    set((s) => {
      const today = new Date().toISOString().slice(0, 10);

      if (s.streaks.lastMarkISO === today) return {};

      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .slice(0, 10);

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

  // ================= UI =================
  setFabSheet: (v) =>
    set((s) => ({ ui: { ...s.ui, fabSheetOpen: v } })),

  // ================= ANALYTICS =================

  initializeAnalytics: async () => {
    const installId = await getInstallId();

    set((s) => ({
      analytics: {
        ...s.analytics,
        installId,
      },
    }));
  },
  
  startSession: () => {

    const now = Date.now();

    set((s) => {

      // existing active session
      if (
        s.analytics.sessionStart &&
        now - s.analytics.sessionStart <
          1000 * 60 * 30
      ) {
        return s;
      }

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const todayData =
        s.analytics.daily[today] ?? {
          sessions: 0,
          totalTime: 0,
          pages: {},
          games: {},
        };

      return {
        analytics: {
          ...s.analytics,

          sessionId:
            uid("sess"),

          sessionStart: now,

          lastActive: now,

          daily: {
            ...s.analytics.daily,

            [today]: {
              ...todayData,

              sessions:
                todayData.sessions + 1,
            },
          },
        },
      };
    });
  },

  trackScreenEnter: (screen: string) => {
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    set((s) => {
      const existing =
        s.analytics.pages[screen];

      // already active → ignore duplicate enter
      if (existing?._lastEnter) {
        return s;
      }

      const page = existing ?? {
        visits: 0,
        totalTime: 0,
        maxSingleVisit: 0,
      };

      return {
        analytics: {
          ...s.analytics,

          currentScreen: screen,

          lastActive: now,

          pages: {
            ...s.analytics.pages,

            [screen]: {
              ...page,

              _lastEnter: now,
            },
          },
          daily: {
            ...s.analytics.daily,

            [today]: {
              ...(s.analytics.daily[today] ?? {
                totalTime: 0,
                sessions: 0,
                pages: {},
                games: {},
              }),

              pages: {
                ...(
                  s.analytics.daily[today]
                    ?.pages ?? {}
                ),

                [screen]: {
                  visits:
                    (
                      s.analytics.daily[
                        today
                      ]?.pages?.[
                        screen
                      ]?.visits ?? 0
                    ) + 1,

                  totalTime:
                    s.analytics.daily[
                      today
                    ]?.pages?.[
                      screen
                    ]?.totalTime ?? 0,
                },
              },
            },
          },
        },
      };
    });
  },

  trackScreenExit: (screen) => {

    const now = Date.now();

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    set((s) => {

      const page =
        s.analytics.pages[screen];

      if (!page?._lastEnter) {
        return s;
      }

      const duration =
        now - page._lastEnter;

      const todayData =
        s.analytics.daily[today] ?? {
          sessions: 0,
          totalTime: 0,
          pages: {},
          games: {},
        };

      const todayPage =
        todayData.pages[screen] ?? {
          visits: 0,
          totalTime: 0,
        };

      return {
        analytics: {
          ...s.analytics,

          lastActive: now,

          pages: {
            ...s.analytics.pages,

            [screen]: {
              ...page,
              
              visits:
                page.visits + 1,

              totalTime:
                page.totalTime +
                duration,

              maxSingleVisit:
                Math.max(
                  page.maxSingleVisit,
                  duration
                ),

              _lastEnter:
                undefined,
            },
          },

          daily: {
            ...s.analytics.daily,

            [today]: {
              ...todayData,

              pages: {
                ...todayData.pages,

                [screen]: {
                  visits:
                    todayPage.visits + 1,

                  totalTime:
                    todayPage.totalTime +
                    duration,

                },
              },
            },
          },
        },
      };
    });
  },

  trackGameEnter: (gameId: string) => {
    const now = Date.now();

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    set((s) => {
      const existing =
        s.analytics.games[gameId];

      if (existing?._lastEnter) {
        return s;
      }

      const game = existing ?? {
        visits: 0,
        totalTime: 0,
        maxSingleVisit: 0,
      };

      return {
        analytics: {
          ...s.analytics,

          games: {
            ...s.analytics.games,

            [gameId]: {
              ...game,

              visits:
                game.visits + 1,

              _lastEnter: now,
            },
          },

          daily: {
            ...s.analytics.daily,

            [today]: {
              ...(s.analytics.daily[today] ?? {
                totalTime: 0,
                sessions: 0,
                pages: {},
                games: {},
              }),

              games: {
                ...(
                  s.analytics.daily[
                    today
                  ]?.games ?? {}
                ),

                [gameId]: {
                  visits:
                    (
                      s.analytics.daily[
                        today
                      ]?.games?.[
                        gameId
                      ]?.visits ?? 0
                    ) + 1,

                  totalTime:
                    s.analytics.daily[
                      today
                    ]?.games?.[
                      gameId
                    ]?.totalTime ?? 0,
                },
              },
            },
          },
        },
      };
    });
  },

  trackGameExit: (gameId: string) => {
    const now = Date.now();

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    set((s) => {
      const game =
        s.analytics.games[gameId];

      if (!game?._lastEnter) {
        return s;
      }

      const duration =
        now - game._lastEnter;

      const existingDay =
        s.analytics.daily[today] ?? {
          totalTime: 0,
          sessions: 0,
          pages: {},
          games: {},
        };

      const existingDailyGame =
        existingDay.games[gameId] ?? {
          visits: 0,
          totalTime: 0,
        };

      return {
        analytics: {
          ...s.analytics,

          games: {
            ...s.analytics.games,

            [gameId]: {
              ...game,

              totalTime:
                game.totalTime +
                duration,

              maxSingleVisit:
                Math.max(
                  game.maxSingleVisit,
                  duration
                ),

              _lastEnter: undefined,
            },
          },

          daily: {
            ...s.analytics.daily,

            [today]: {
              ...existingDay,

              games: {
                ...existingDay.games,

                [gameId]: {
                  visits:
                    existingDailyGame.visits,

                  totalTime:
                    existingDailyGame.totalTime +
                    duration,
                },
              },
            },
          },
        },
      };
    });
  },
  
  startAnalyticsUploader: () => {

    // avoid duplicate intervals
    if (
      typeof window !== "undefined" &&
      (window as any)
        .__kampusAnalyticsUploader
    ) {
      return;
    }

    const run = async () => {
      try {

        // finalize previous days
        await get()
          .rolloverAnalyticsDay();

        // flush queue
        await flushAnalyticsQueue(
          sendToFirebase
        );

      } catch (err) {
        console.error(
          "[ANALYTICS] uploader failed:",
          err
        );
      }
    };

    // initial run
    void run();

    // periodic uploader
    const interval =
      window.setInterval(
        run,
        1000 * 60 * 15
      );

    (
      window as any
    ).__kampusAnalyticsUploader =
      interval;
  },

  markProfileDirty: () => {
    set((s) => ({
      profileAnalytics: {
        ...s.profileAnalytics,
        dirty: true,
      },
    }));

    // rebuild latest snapshot immediately
    get().buildProfileSnapshot();
  },

  buildProfileSnapshot: () => {
    const state = get();

    const today =
      new Date().toISOString().slice(0, 10);

    const snapshot = {
      studentName: state.settings.studentName,

      semesters: state.semesters.map((sem) => ({
        id: sem.id,
        number: sem.number,
        name: sem.name,

        subjects: sem.subjects.map((sub) => ({
          id: sub.id,
          name: sub.name,
          credits: sub.credits,
        })),
      })),
    };

    set((s) => ({
      profileAnalytics: {
        ...s.profileAnalytics,
        pendingProfile: snapshot,
        dirty: true,
        lastSnapshotDate: today,
      },
    }));
  },

  clearProfileDirty: () => {
    const today =
      new Date().toISOString().slice(0, 10);

    set((s) => ({
      profileAnalytics: {
        ...s.profileAnalytics,
        dirty: false,
        lastSnapshotDate: today,
      },
    }));
  },

  buildDailyAnalyticsPacket: (date) => {
    const state = get();
    const daily =
      state.analytics.daily[date];

    if (!daily) return;

    const pages: Record<
      string,
      {
        visits: number;
        totalTime: number;
      }
    > = {};

    for (const [screen, data] of Object.entries(
      state.analytics.pages
    )) {
      if (
        data.visits <= 0 &&
        data.totalTime <= 0
      ) {
        continue;
      }

      pages[screen] = {
        visits: data.visits,
        totalTime: data.totalTime,
      };
    }

    const games: Record<
      string,
      {
        visits: number;
        totalTime: number;
      }
    > = {};

    for (const [gameId, data] of Object.entries(
      state.analytics.games
    )) {
      if (
        data.visits <= 0 &&
        data.totalTime <= 0
      ) {
        continue;
      }

      games[gameId] = {
        visits: data.visits,
        totalTime: data.totalTime,
      };
    }

    const packet: PendingAnalyticsPacket = {
      date,

      behavior: {
        sessions: daily.sessions,
        totalTime: daily.totalTime,
        pages,
      },
    };

    // optional profile block
    if (
      state.profileAnalytics.dirty &&
      state.profileAnalytics.pendingProfile
    ) {
      packet.profile =
        state.profileAnalytics.pendingProfile;
    }

    // optional games block
    if (
      Object.keys(games).length > 0
    ) {
      packet.games = games;
    }

    set((s) => ({
      pendingAnalyticsPackets: [
        ...s.pendingAnalyticsPackets,
        packet,
      ],
    }));
  },

  clearAnalyticsDay: (date) => {
    set((s) => {
      const nextDaily = {
        ...s.analytics.daily,
      };

      delete nextDaily[date];

      return {
        analytics: {
          ...s.analytics,
          daily: nextDaily,
        },
      };
    });
  },

  rolloverAnalyticsDay: async () => {
    const state = get();

    const installId =
      state.analytics.installId;

    if (!installId) return;

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    // ================= ENQUEUE DAILY PACKETS =================

    for (const [
      date,
      latest,
    ] of Object.entries(
      state.analytics.daily
    )) {

      // skip active day
      if (date === today) {
        continue;
      }

      // already uploaded
      if (
        latest?.finalized ||
        latest?.uploading
      ) {
        continue;
      }

      const encoded =
        encodeAnalyticsPacket(
          installId,
          {
            date,
            data: latest,
          }
        );

      if (!encoded) {
        continue;
      }

      try {

        set((s) => ({
          analytics: {
            ...s.analytics,

            daily: {
              ...s.analytics.daily,

              [date]: {
                ...s.analytics.daily[
                  date
                ],

                uploading: true,
              },
            },
          },
        }));

        await enqueueAnalytics(
          encoded
        );


      } catch (err) {

        console.error(
          "[ANALYTICS] enqueue failed:",
          err
        );
      }
    }

    // ================= ENQUEUE PROFILE SNAPSHOT =================

    try {

      const profile =
        get().profileAnalytics;

      if (
        profile.dirty &&
        profile.pendingProfile &&
        profile.lastSnapshotDate !==
          today
      ) {

        const profilePacket =
          JSON.stringify({
            type: "profile",

            installId,

            date: today,

            profile:
              profile.pendingProfile,
          });

        await enqueueAnalytics(
          profilePacket
        );

        get().clearProfileDirty();
      }

    } catch (err) {

      console.error(
        "[PROFILE] enqueue failed:",
        err
      );
    }

    // ================= FLUSH QUEUE =================

    try {

      const uploadedPackets =
        await flushAnalyticsQueue(
          sendToFirebase
        );

      if (
        uploadedPackets.length === 0
      ) {
        console.warn(
          "[ANALYTICS] nothing uploaded"
        );
        return;
      }
      const uploadedDates =
        uploadedPackets
          .map((packet) => {

            const parts =
              packet.includes("§")
                ? packet.split("§")
                : packet.split("|");

            return parts[2];
          })
          .filter(Boolean);
      

      // ONLY NOW mark finalized
      set((s) => {
        const updatedDaily = {
          ...s.analytics.daily,

          ...Object.fromEntries(
            uploadedDates.map(
              (date) => [
                date,
                {
                  ...s.analytics.daily[
                    date
                  ],

                  uploaded: true,
                  uploading: false,
                  finalized: true,
                },
              ]
            )
          ),
        };

        return {
          analytics: {
            ...s.analytics,

            daily:
              cleanupOldAnalyticsDays(
                updatedDaily,
                60
              ),
          },
        };
      });

    } catch (err) {

      console.error(
        "[ANALYTICS] flush failed:",
        err
      );
    }
  },

  finalizeSession: () => {

    const now = Date.now();

    set((s) => {

      if (
        !s.analytics.sessionStart
      ) {
        return s;
      }

      const currentScreen =
        s.analytics.currentScreen;

      let updatedPages =
        s.analytics.pages;

      if (currentScreen) {

        const current =
          updatedPages[currentScreen];

        if (current?._lastEnter) {

          const pageDuration =
            now -
            current._lastEnter;

          updatedPages = {
            ...updatedPages,

            [currentScreen]: {
              ...current,

              totalTime:
                current.totalTime +
                pageDuration,

              maxSingleVisit:
                Math.max(
                  current.maxSingleVisit,
                  pageDuration
                ),

              _lastEnter: undefined,
            },
          };
        }
      }

      const duration =
        Math.max(
          0,
          now -
            s.analytics.sessionStart
        );

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const todayData =
        s.analytics.daily[today] ?? {
          sessions: 0,
          totalTime: 0,
          pages: {},
          games: {},
        };

      return {
        analytics: {
          ...s.analytics,
        pages: updatedPages,

          daily: {
            ...s.analytics.daily,

            [today]: {
              ...todayData,

              totalTime:
                todayData.totalTime +
                duration,
            },
          },

          sessionStart: null,
        },
      };
    });
  },

  // ================= EXPORT / IMPORT =================
  exportData: async () => {
    const state = get();
    const installId = await idbGet<string>("meta", "install_id");

    return JSON.stringify(
      {
        schemaVersion: 3,
        exportedAt: new Date().toISOString(),

        app: "Kampus",
        version: "1.0",

        data: {
          installId,
          semesters: state.semesters,
          activeSemesterId: state.activeSemesterId,
          currentSemesterId: state.currentSemesterId,

          schedule: state.schedule,
          attendance: state.attendance,

          holidayOverrides: state.holidayOverrides,
          extraClasses: state.extraClasses,

          expenses: state.expenses,
          monthlyBudget: state.monthlyBudget,

          games: state.games,

          settings: state.settings,
          streaks: state.streaks,
        },
      },
      null,
      2
    );
  },

  importData: async (json) => {
    try {
    const parsed = JSON.parse(json);

    const importedInstallId =
      typeof parsed.data?.installId === "string"
        ? parsed.data.installId
        : null;

      // ================= BASIC VALIDATION =================
      if (!parsed || typeof parsed !== "object") {
        console.warn("Invalid backup structure");
        return false;
      }

      // ================= SCHEMA CHECK =================
      if (parsed.schemaVersion !== 3) {
        console.warn(
          "Unsupported schema version:",
          parsed.schemaVersion
        );
        return false;
      }

      // ================= DATA BLOCK =================
      const data = parsed.data;

      if (!data || typeof data !== "object") {
        console.warn("Missing data block");
        return false;
      }

      // ================= SAFE SEMESTERS =================
      const semesters: Semester[] =
        Array.isArray(data.semesters) && data.semesters.length > 0
          ? data.semesters
          : [makeFirstSemester()];

      // ================= SAFE IDS =================
      const parsedCurrentId =
        typeof data.currentSemesterId === "string"
          ? data.currentSemesterId
          : null;

      const parsedActiveId =
        typeof data.activeSemesterId === "string"
          ? data.activeSemesterId
          : null;

      // ================= RESOLVE SAFE SEMESTER =================
      let safeCurrentId: string | null = null;

      if (
        parsedCurrentId &&
        semesters.some((s) => s.id === parsedCurrentId)
      ) {
        safeCurrentId = parsedCurrentId;
      } else if (
        parsedActiveId &&
        semesters.some((s) => s.id === parsedActiveId)
      ) {
        safeCurrentId = parsedActiveId;
      } else if (semesters.length > 0) {
        safeCurrentId = semesters[semesters.length - 1].id;
      }

      if (importedInstallId) {
        await idbSet(
          "meta",
          "install_id",
          importedInstallId
        );
      }

      // ================= APPLY IMPORT =================
      set({
        semesters,

        activeSemesterId: safeCurrentId,
        currentSemesterId: safeCurrentId,

        schedule:
          typeof data.schedule === "object" && data.schedule
            ? data.schedule
            : {},

        attendance:
          typeof data.attendance === "object" && data.attendance
            ? data.attendance
            : {},

        holidayOverrides:
          typeof data.holidayOverrides === "object" &&
          data.holidayOverrides
            ? data.holidayOverrides
            : {},

        extraClasses: Array.isArray(data.extraClasses)
          ? data.extraClasses
          : [],

        expenses: Array.isArray(data.expenses)
          ? data.expenses
          : [],

        monthlyBudget:
          typeof data.monthlyBudget === "number"
            ? data.monthlyBudget
            : 5000,

        games:
          typeof data.games === "object" && data.games
            ? data.games
            : {},

        settings: {
          ...DEFAULT_SETTINGS,
          ...(data.settings ?? {}),
        },

        streaks: {
          ...DEFAULT_STREAKS,
          ...(data.streaks ?? {}),
        },
        analytics: {
          ...get().analytics,

          installId:
            importedInstallId ??
            get().analytics.installId,
        },
      });

      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  },

  resetAll: () =>
  set(() => {
    const first = makeFirstSemester();

    return {
      semesters: [first],

      // 🔥 CRITICAL FIX
      activeSemesterId: first.id,
      currentSemesterId: first.id,

      schedule: {},
      attendance: {},
      holidayOverrides: {},
      extraClasses: [],
      expenses: [],
      monthlyBudget: 5000,
      games: {},
      settings: DEFAULT_SETTINGS,
      streaks: DEFAULT_STREAKS,
    };
  }),

}));

// ============= Hydration + Auto-persist =============
const PERSIST_KEYS = [
  "semesters",
  // semester pointers
  "activeSemesterId",
  "currentSemesterId",

  "schedule",
  "attendance",

  "holidayOverrides",
  "extraClasses",

  "expenses",
  "monthlyBudget",

  "games",

  "settings",
  "streaks",
  "analytics",
] as const;

let hydrating = false;
let analyticsUploaderStarted = false;

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
    useStore.setState({
      ...updates,
      hydrated: true,
    });

    // ================= CLEAN RUNTIME ANALYTICS =================
    const analytics =
      (updates as Partial<StudentOSState>)
        .analytics;

    if (analytics) {
      analytics.currentScreen =
        null;

      if (analytics.pages) {
        for (const page of Object.values(
          analytics.pages
        )) {
          delete page._lastEnter;
        }
      }
    }
    // Apply theme class on load (also handled by inline script for no-flash, but ensure consistency)
    const theme = (updates.settings as Settings | undefined)?.theme ?? "neon";
    document.documentElement.classList.remove("theme-neon", "theme-matte", "theme-pop", "theme-focus");
    document.documentElement.classList.add(`theme-${theme}`);
  } catch {
    useStore.setState({ hydrated: true });
  }
}

const persist = debounce(
  ((state: StudentOSState) => {
    for (const k of PERSIST_KEYS) {
      // ================= ANALYTICS SANITIZATION =================
      if (k === "analytics") {
        const cleanPages: Record<
          string,
          {
            visits: number;
            totalTime: number;
            maxSingleVisit: number;
          }
        > = {};

        for (const [
          pageName,
          page,
        ] of Object.entries(
          state.analytics.pages
        )) {
          cleanPages[pageName] = {
            visits: page.visits,
            totalTime:
              page.totalTime,
            maxSingleVisit:
              page.maxSingleVisit,
          };
        }

        void idbSet(
          "settings",
          "analytics",
          {
            ...state.analytics,

            // runtime-only values removed
            currentScreen: null,

            pages: cleanPages,
          }
        );

        continue;
      }

      void idbSet(
        "settings",
        k,
        state[k]
      );
    }
  }) as (
    ...args: unknown[]
  ) => void,
  250
);

export function startPersistence() {
  if (typeof window === "undefined") return;
  useStore.subscribe((state) => {
    if (!state.hydrated) return;
    persist(state);
    //const today = new Date().toISOString().slice(0, 10);
    // if new day starts → you can later send packet
    //void state.analytics.daily[today];
  });
}