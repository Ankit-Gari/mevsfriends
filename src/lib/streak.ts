import { getISTDateStr } from "@/constants/games/block-blast/Rng";
import { supabase } from "@/lib/supabase";

export async function getCurrentStreak(userId: string, todayIST: string): Promise<number> {
  const { data, error } = await supabase.rpc("current_streak", { p_user_id: userId, p_today: todayIST });
  if (error) throw error;
  return data ?? 0;
}

export async function getLongestStreak(userId: string, monthKey: string): Promise<number> {
  const { data, error } = await supabase.rpc("longest_streak", { p_user_id: userId, p_month_key: monthKey });
  if (error) throw error;
  return data ?? 0;
}

export interface DayMark {
  date: string;
  played: boolean;
}

// Per supabase/03_read_queries.sql #5 — this user's play_date rows in
// streak_log for the last 7 IST calendar days, rendered as filled/empty dots.
export async function getLast7Days(userId: string): Promise<DayMark[]> {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(getISTDateStr(new Date(Date.now() - i * 24 * 60 * 60 * 1000)));
  }

  const { data, error } = await supabase
    .from("streak_log")
    .select("play_date")
    .eq("user_id", userId)
    .in("play_date", days);

  if (error) throw error;
  const playedDates = new Set(data.map((row) => row.play_date));

  return days.map((date) => ({ date, played: playedDates.has(date) }));
}

export interface StreakLeaderboardRow {
  userId: string;
  username: string;
  streak: number;
}

// One current_streak() call per profile — fine at this user count (see
// phase5 brief: don't over-engineer a batched version yet).
export async function getStreakLeaderboard(todayIST: string): Promise<StreakLeaderboardRow[]> {
  const { data: profiles, error } = await supabase.from("profiles").select("id, username");
  if (error) throw error;

  const rows = await Promise.all(
    profiles.map(async (profile) => ({
      userId: profile.id,
      username: profile.username,
      streak: await getCurrentStreak(profile.id, todayIST),
    })),
  );

  return rows.sort((a, b) => b.streak - a.streak);
}
