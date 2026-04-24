export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function dateHash(date = new Date()): number {
  // Stable per-day integer
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

export function pickByDay<T>(arr: readonly T[], date = new Date()): T {
  if (arr.length === 0) throw new Error("pickByDay: empty array");
  return arr[dateHash(date) % arr.length];
}

export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function timeOfDayGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night grind";
}

export function isClient(): boolean {
  return typeof window !== "undefined";
}
