// Rotating signature lines per page. Pure data, no React.
export type Page = "attendance" | "grades" | "expenses" | "games" | "insights" | "global" | "about";

export const SIGNATURES: Record<Page, readonly string[]> = {
  attendance: [
    "Still legally enrolled.",
    "One more bunk and it's over.",
    "Academic funeral loading…",
    "Professor hasn't noticed yet.",
    "Attendance hanging by WiFi signal.",
  ],
  grades: [
    "Built different.",
    "Character development arc.",
    "The comeback story begins here.",
    "Scholarship aura detected.",
    "Cooked.",
  ],
  expenses: [
    "Budget left the chat.",
    "You bought happiness again.",
    "Financial decisions were made.",
    "Time to call parents.",
  ],
  games: [
    "Launching dopamine engines…",
    "Brainrot synchronization complete.",
    "Productivity temporarily suspended.",
    "Mental stability not guaranteed.",
  ],
  insights: [
    "We analyzed your bad decisions.",
    "Patterns were detected.",
    "Statistically concerning.",
    "The numbers are judging you.",
  ],
  global: [
    "Built on caffeine and poor decisions.",
    "Emotionally optimized for students.",
    "Semester boss battle active.",
    "Surviving semester.exe",
    "Productivity not guaranteed.",
  ],
  about: [
    "Productivity not guaranteed.",
    "Semester boss battle active.",
    "Emotionally optimized for students.",
    "Built during academic downfall.",
    "Surviving semester.exe",
  ],
};

/** Pick a signature based on a stable rotation seed (page load time). */
export function pickSignature(page: Page, seed = Date.now()): string {
  const list = SIGNATURES[page];
  return list[seed % list.length];
}
