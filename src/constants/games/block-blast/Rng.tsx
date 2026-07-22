// Deterministic, worklet-safe PRNG for seeded Ranked mode + IST date helpers.
// Isolation rule: ONLY piece-SHAPE selection pulls from this generator.
// Colors, particles, and menu animations keep using Math.random() so they
// don't consume seeded state and desync the piece sequence between players.

export function makeDailySeed(year: number, month: number, day: number): number {
  "worklet";
  return year * 10000 + month * 100 + day;
}

export function mulberry32(state: number): { value: number; nextState: number } {
  "worklet";
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState: a };
}

// IST is a fixed UTC+5:30 offset (no DST) — pure integer math, no Intl/timezone APIs.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export function getISTDateParts(now: Date = new Date()): { year: number; month: number; day: number } {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

export function getTodaysDailySeed(): number {
  const { year, month, day } = getISTDateParts();
  return makeDailySeed(year, month, day);
}

export function getISTMonthKey(now: Date = new Date()): string {
  const { year, month } = getISTDateParts(now);
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getISTDateStr(now: Date = new Date()): string {
  const { year, month, day } = getISTDateParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
