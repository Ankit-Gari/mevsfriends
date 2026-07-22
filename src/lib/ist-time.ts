import { getISTDateParts } from "@/constants/games/block-blast/Rng";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// Shared by Leaderboard (monthly reset) and Streak (same monthly cadence) —
// game-agnostic, so it lives outside the block-blast module even though it
// reuses that module's IST date-part math rather than reimplementing it.
export function getISTMonthEndCountdown(now: Date = new Date()): string {
  const { year, month } = getISTDateParts(now);
  const nextMonthUtcMs = Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1) - IST_OFFSET_MS;
  const totalMinutes = Math.max(0, Math.floor((nextMonthUtcMs - now.getTime()) / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
