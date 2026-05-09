import type { AttendanceRecord, Subject, AttendanceStatus } from "@/core/store";

export interface SubjectAttendance {
  subject: Subject;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  status: "safe" | "ok" | "warning" | "danger";
}

export function subjectAttendance(
  subjects: Subject[],
  attendance: AttendanceRecord,
  target: number,
): SubjectAttendance[] {

  const map = new Map<string, { p: number; a: number }>();
  for (const sub of subjects) map.set(sub.id, { p: 0, a: 0 });

  for (const [key, status] of Object.entries(attendance)) {
    const subId = key.split("_").slice(1).join("_");
    const bucket = map.get(subId);
    if (!bucket) continue;

    if (status === "present") bucket.p++;
    else if (status === "absent") bucket.a++;
  }

  return subjects.map((sub) => {

    const { p, a } = map.get(sub.id) ?? { p: 0, a: 0 };
    const total = p + a;
    const pct = total === 0 ? 100 : (p / total) * 100;

    const type = sub.type;

    const effectiveTarget =
      type === "TRACKED"
        ? 70
        : type === "IGNORE"
        ? -1
        : target;

    let status: SubjectAttendance["status"] = "safe";

    if (type !== "IGNORE") {
      if (pct < effectiveTarget - 10) status = "danger";
      else if (pct < effectiveTarget) status = "warning";
      else if (pct < effectiveTarget + 5) status = "ok";
    }

    return {
      subject: sub,
      present: p,
      absent: a,
      total,
      percentage: pct,
      status,
    };
  });
}

/**
 * RULE: Overall attendance = only CORE subjects average
 */
export function overallPercentage(items: SubjectAttendance[]): number {

  const considered = items.filter((i) => {
    return i.subject.type === "CORE" && i.total > 0;
  });

  if (considered.length === 0) return 100;

  const sum = considered.reduce((s, i) => s + i.percentage, 0);
  return sum / considered.length;
}

export function safeSkippable(present: number, total: number, target: number): number {
  if (target <= 0) return Infinity;
  const v = Math.floor((present * 100 - target * total) / target);
  return Math.max(0, v);
}

export function recoveryClasses(present: number, total: number, target: number): number {
  if (target >= 100) return Infinity;
  const num = target * total - 100 * present;
  if (num <= 0) return 0;
  return Math.ceil(num / (100 - target));
}

export function projectSkip(present: number, total: number, skip: number): number {
  const t = total + skip;
  if (t === 0) return 100;
  return (present / t) * 100;
}

export function projectAttend(present: number, total: number, attend: number): number {
  const t = total + attend;
  if (t === 0) return 100;
  return ((present + attend) / t) * 100;
}

export interface DayAttendance {
  dateISO: string;
  weekday: number;
  records: Array<{ subject: Subject; status: AttendanceStatus | null }>;
}

export function dayAttendance(
  dateISO: string,
  weekday: number,
  scheduleForDay: string[],
  subjects: Subject[],
  attendance: AttendanceRecord,
): DayAttendance {

  const subsById = new Map(subjects.map((s) => [s.id, s]));

  const records = scheduleForDay
    .map((sid) => subsById.get(sid))
    .filter((s): s is Subject => Boolean(s))
    .map((sub) => ({
      subject: sub,
      status: (attendance[`${dateISO}_${sub.id}`] as AttendanceStatus | undefined) ?? null,
    }));

  return { dateISO, weekday, records };
}

export function isoFromDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isoToday(): string {
  return isoFromDate(new Date());
}

export function dateFromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}