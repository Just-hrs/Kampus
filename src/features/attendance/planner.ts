import type { Subject, DaySchedule, AttendanceRecord, ExtraClass } from "@/core/store";
import { isEffectiveHoliday, getHoliday } from "./holidays";
import { isoFromDate } from "./logic";

export type PlanDecision = "go" | "skip";
export type PlannerMode = "max-bunk" | "clear-day" | "hated" | "manual";

export interface PlanSlot {
  dateISO: string;
  weekday: number;
  subjectId: string;
  decision: PlanDecision;
  /** Holiday context — never counts toward attendance. */
  holiday?: string | null;
  /** From extraClasses store, not from weekly schedule. */
  extra?: boolean;
}

export interface PlanDay {
  dateISO: string;
  weekday: number;
  holiday: string | null;
  slots: PlanSlot[];
}

export interface SubjectTally {
  subjectId: string;
  presentNow: number;
  totalNow: number;
  presentAfter: number;
  totalAfter: number;
  pctNow: number;
  pctAfter: number;
}

/* ---------- Tally helpers ---------- */
export function tallyFromAttendance(
  subjects: Subject[],
  attendance: AttendanceRecord,
): Map<string, { p: number; t: number }> {
  const m = new Map<string, { p: number; t: number }>();
  for (const s of subjects) m.set(s.id, { p: 0, t: 0 });
  for (const [k, v] of Object.entries(attendance)) {
    const subId = k.split("_").slice(1).join("_");
    const b = m.get(subId);
    if (!b) continue;
    if (v === "present") {
      b.p++;
      b.t++;
    } else if (v === "absent") {
      b.t++;
    }
    // cancelled excluded from total
  }
  return m;
}

/** Average-of-percentages overall, ignoring zero-total subjects. */
export function averagePercent(tally: Map<string, { p: number; t: number }>): number {
  const items = Array.from(tally.values()).filter((b) => b.t > 0);
  if (items.length === 0) return 100;
  return items.reduce((s, b) => s + (b.p / b.t) * 100, 0) / items.length;
}

/* ---------- Future day enumeration ---------- */
function effectiveSlotsForDay(
  dateISO: string,
  weekday: number,
  schedule: DaySchedule,
  subjects: Subject[],
  extras: ExtraClass[],
  holidayOverrides: Record<string, "holiday" | "working">,
): { holiday: string | null; subjectIds: string[]; extras: ExtraClass[] } {
  const isHol = isEffectiveHoliday(dateISO, holidayOverrides);
  const validSubs = new Set(
    subjects
      .filter(
        (s) =>
          (!s.startDateISO || dateISO >= s.startDateISO) &&
          (!s.endDateISO || dateISO <= s.endDateISO),
      )
      .map((s) => s.id),
  );
  const todaysExtras = extras.filter((x) => x.dateISO === dateISO && validSubs.has(x.subjectId));
  if (isHol) {
    return {
      holiday:
        holidayOverrides[dateISO] === "working" ? null : (getHolName(dateISO) ?? "Holiday"),
      subjectIds: [],
      extras: todaysExtras,
    };
  }
  const day = (schedule[weekday] ?? []).filter((id) => validSubs.has(id));
  return { holiday: null, subjectIds: day, extras: todaysExtras };
}

function getHolName(iso: string): string | null {
  return getHoliday(iso)?.name ?? null;
}

/** Build N future days starting tomorrow. */
export function buildFutureDays(
  startDate: Date,
  numDays: number,
  schedule: DaySchedule,
  subjects: Subject[],
  extras: ExtraClass[],
  holidayOverrides: Record<string, "holiday" | "working">,
): PlanDay[] {
  const days: PlanDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = isoFromDate(d);
    const weekday = d.getDay();
    const ctx = effectiveSlotsForDay(iso, weekday, schedule, subjects, extras, holidayOverrides);
    const slots: PlanSlot[] = [
      ...ctx.subjectIds.map((sid) => ({
        dateISO: iso,
        weekday,
        subjectId: sid,
        decision: "go" as PlanDecision,
        holiday: ctx.holiday,
      })),
      ...ctx.extras.map((x) => ({
        dateISO: iso,
        weekday,
        subjectId: x.subjectId,
        decision: "go" as PlanDecision,
        extra: true,
      })),
    ];
    days.push({ dateISO: iso, weekday, holiday: ctx.holiday, slots });
  }
  return days;
}

/* ---------- Projection ---------- */
export function projectPlan(
  baseTally: Map<string, { p: number; t: number }>,
  days: PlanDay[],
  decisions: Record<string, PlanDecision>, // key: `${dateISO}_${subjectId}_${i}`
): Map<string, { p: number; t: number }> {
  const next = new Map<string, { p: number; t: number }>();
  for (const [k, v] of baseTally) next.set(k, { p: v.p, t: v.t });
  for (const day of days) {
    if (day.holiday) continue;
    day.slots.forEach((s, i) => {
      const key = `${s.dateISO}_${s.subjectId}_${i}`;
      const dec = decisions[key] ?? s.decision;
      const b = next.get(s.subjectId);
      if (!b) return;
      b.t++;
      if (dec === "go") b.p++;
    });
  }
  return next;
}

/* ---------- Strategies ---------- */

/** Greedy: maximize bunks while keeping each subject ≥ target. */
export function strategyMaxBunk(
  baseTally: Map<string, { p: number; t: number }>,
  days: PlanDay[],
  target: number,
): Record<string, PlanDecision> {
  const decisions: Record<string, PlanDecision> = {};
  // Live tally we mutate as we plan
  const live = new Map<string, { p: number; t: number }>();
  for (const [k, v] of baseTally) live.set(k, { p: v.p, t: v.t });

  // First, count total future occurrences per subject — to know room.
  const futureCount = new Map<string, number>();
  for (const day of days) {
    if (day.holiday) continue;
    for (const s of day.slots) {
      futureCount.set(s.subjectId, (futureCount.get(s.subjectId) ?? 0) + 1);
    }
  }

  for (const day of days) {
    if (day.holiday) continue;
    day.slots.forEach((s, i) => {
      const key = `${s.dateISO}_${s.subjectId}_${i}`;
      const b = live.get(s.subjectId);
      if (!b) {
        decisions[key] = "skip";
        return;
      }
      const remainingFuture = (futureCount.get(s.subjectId) ?? 0) - 1;
      futureCount.set(s.subjectId, remainingFuture);
      // If we skip this class, project final pct = b.p / (b.t + 1 + remainingFuture(all attended))
      const wouldP = b.p;
      const wouldT = b.t + 1 + remainingFuture;
      const pctIfSkip = wouldT === 0 ? 100 : (wouldP / wouldT) * 100;
      if (pctIfSkip >= target) {
        decisions[key] = "skip";
        b.t++; // skipped → counted absent
      } else {
        decisions[key] = "go";
        b.p++;
        b.t++;
      }
    });
  }
  return decisions;
}

/** Try to fully bunk entire days. Picks days where skipping all keeps target met. */
export function strategyClearDay(
  baseTally: Map<string, { p: number; t: number }>,
  days: PlanDay[],
  target: number,
): Record<string, PlanDecision> {
  const decisions: Record<string, PlanDecision> = {};
  const live = new Map<string, { p: number; t: number }>();
  for (const [k, v] of baseTally) live.set(k, { p: v.p, t: v.t });

  // Pre-compute remaining future per subject
  const futureCount = new Map<string, number>();
  for (const day of days) {
    if (day.holiday) continue;
    for (const s of day.slots) {
      futureCount.set(s.subjectId, (futureCount.get(s.subjectId) ?? 0) + 1);
    }
  }

  for (const day of days) {
    if (day.holiday || day.slots.length === 0) continue;
    // Hypothetical: skip all today's slots — final pct per subject (assume rest attended)
    const hypothetical = new Map<string, { p: number; t: number }>();
    for (const [k, v] of live) hypothetical.set(k, { p: v.p, t: v.t });
    const dayCounts = new Map<string, number>();
    for (const s of day.slots) {
      dayCounts.set(s.subjectId, (dayCounts.get(s.subjectId) ?? 0) + 1);
    }
    let safe = true;
    for (const [subId, count] of dayCounts) {
      const b = hypothetical.get(subId);
      if (!b) continue;
      const remainAfterToday = (futureCount.get(subId) ?? 0) - count;
      const finalP = b.p + remainAfterToday;
      const finalT = b.t + count + remainAfterToday;
      const pct = finalT === 0 ? 100 : (finalP / finalT) * 100;
      if (pct < target) {
        safe = false;
        break;
      }
    }
    day.slots.forEach((s, i) => {
      const key = `${s.dateISO}_${s.subjectId}_${i}`;
      const b = live.get(s.subjectId);
      if (!b) {
        decisions[key] = safe ? "skip" : "go";
        return;
      }
      futureCount.set(s.subjectId, (futureCount.get(s.subjectId) ?? 0) - 1);
      if (safe) {
        decisions[key] = "skip";
        b.t++;
      } else {
        decisions[key] = "go";
        b.p++;
        b.t++;
      }
    });
  }
  return decisions;
}

/** Bunk only selected (hated) subjects greedily, attend the rest. */
export function strategyHated(
  baseTally: Map<string, { p: number; t: number }>,
  days: PlanDay[],
  target: number,
  hatedIds: Set<string>,
): Record<string, PlanDecision> {
  const decisions: Record<string, PlanDecision> = {};
  const live = new Map<string, { p: number; t: number }>();
  for (const [k, v] of baseTally) live.set(k, { p: v.p, t: v.t });

  const futureCount = new Map<string, number>();
  for (const day of days) {
    if (day.holiday) continue;
    for (const s of day.slots) {
      futureCount.set(s.subjectId, (futureCount.get(s.subjectId) ?? 0) + 1);
    }
  }

  for (const day of days) {
    if (day.holiday) continue;
    day.slots.forEach((s, i) => {
      const key = `${s.dateISO}_${s.subjectId}_${i}`;
      const b = live.get(s.subjectId);
      if (!b) {
        decisions[key] = "go";
        return;
      }
      const remaining = (futureCount.get(s.subjectId) ?? 0) - 1;
      futureCount.set(s.subjectId, remaining);
      if (!hatedIds.has(s.subjectId)) {
        decisions[key] = "go";
        b.p++;
        b.t++;
        return;
      }
      const pctIfSkip =
        b.t + 1 + remaining === 0 ? 100 : (b.p / (b.t + 1 + remaining)) * 100;
      if (pctIfSkip >= target) {
        decisions[key] = "skip";
        b.t++;
      } else {
        decisions[key] = "go";
        b.p++;
        b.t++;
      }
    });
  }
  return decisions;
}
