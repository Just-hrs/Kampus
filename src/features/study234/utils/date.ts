export const DAY_MS = 86_400_000;

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function daysBetween(aTs: number, bTs: number) {
  // number of full days between two timestamps (b - a)
  return Math.floor((bTs - aTs) / DAY_MS);
}

