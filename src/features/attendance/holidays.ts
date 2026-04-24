/* Indian holiday engine — fixed-date national holidays + auto-Sundays.
 * Lightweight, no external dependency. Users can override per-day via store.holidayOverrides.
 */

export interface HolidayInfo {
  name: string;
  type: "weekend" | "national" | "festival" | "custom";
}

// Fixed-date national + popular festival holidays (month is 1-indexed here).
// Floating festivals (Diwali, Holi, Eid) are intentionally curated for 2024-2027 only.
const FIXED: ReadonlyArray<{ md: string; name: string; type: HolidayInfo["type"] }> = [
  { md: "01-01", name: "New Year", type: "festival" },
  { md: "01-14", name: "Makar Sankranti", type: "festival" },
  { md: "01-26", name: "Republic Day", type: "national" },
  { md: "05-01", name: "Labour Day", type: "national" },
  { md: "08-15", name: "Independence Day", type: "national" },
  { md: "10-02", name: "Gandhi Jayanti", type: "national" },
  { md: "12-25", name: "Christmas", type: "festival" },
];

// Curated floating-date Indian festivals (YYYY-MM-DD). Extend as needed.
const FLOATING: Record<string, string> = {
  // 2024
  "2024-03-25": "Holi",
  "2024-04-11": "Eid al-Fitr",
  "2024-08-19": "Raksha Bandhan",
  "2024-08-26": "Janmashtami",
  "2024-10-12": "Dussehra",
  "2024-11-01": "Diwali",
  // 2025
  "2025-03-14": "Holi",
  "2025-03-31": "Eid al-Fitr",
  "2025-08-09": "Raksha Bandhan",
  "2025-08-16": "Janmashtami",
  "2025-10-02": "Dussehra",
  "2025-10-20": "Diwali",
  // 2026
  "2026-03-04": "Holi",
  "2026-03-21": "Eid al-Fitr",
  "2026-08-28": "Raksha Bandhan",
  "2026-09-04": "Janmashtami",
  "2026-10-20": "Dussehra",
  "2026-11-08": "Diwali",
  // 2027
  "2027-03-23": "Holi",
  "2027-03-11": "Eid al-Fitr",
  "2027-08-17": "Raksha Bandhan",
  "2027-08-25": "Janmashtami",
  "2027-10-09": "Dussehra",
  "2027-10-28": "Diwali",
};

/** Returns holiday info if the date is a Sunday or known Indian holiday. */
export function getHoliday(iso: string): HolidayInfo | null {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getDay() === 0) return { name: "Sunday", type: "weekend" };
  const md = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const fixed = FIXED.find((f) => f.md === md);
  if (fixed) return { name: fixed.name, type: fixed.type };
  if (FLOATING[iso]) return { name: FLOATING[iso], type: "festival" };
  return null;
}

/** Whether a date is a holiday after applying user overrides. */
export function isEffectiveHoliday(
  iso: string,
  overrides: Record<string, "holiday" | "working">,
): boolean {
  const ov = overrides[iso];
  if (ov === "working") return false;
  if (ov === "holiday") return true;
  return getHoliday(iso) !== null;
}
