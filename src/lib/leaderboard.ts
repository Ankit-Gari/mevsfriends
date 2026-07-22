import { supabase } from "@/lib/supabase";

export interface LeaderboardRow {
  userId: string;
  username: string;
  bestScore: number;
}

// Mirrors supabase/03_read_queries.sql #1 (MAX(final_score) per player, this
// month, this game) but done as a fetch + client-side reduce rather than a
// raw SQL group-by, since supabase-js's query builder has no GROUP BY/MAX —
// fine at this scale (see phase5 brief: don't over-engineer this yet).
export async function getMonthlyLeaderboard(gameId: string, monthKey: string): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("ranked_runs")
    .select("final_score, user_id, profiles(username)")
    .eq("game_id", gameId)
    .eq("month_key", monthKey);

  if (error) throw error;

  const bestByUser = new Map<string, LeaderboardRow>();
  for (const run of data) {
    const profile = Array.isArray(run.profiles) ? run.profiles[0] : run.profiles;
    if (!profile) continue;
    const existing = bestByUser.get(run.user_id);
    if (!existing || run.final_score > existing.bestScore) {
      bestByUser.set(run.user_id, {
        userId: run.user_id,
        username: profile.username,
        bestScore: run.final_score,
      });
    }
  }

  return Array.from(bestByUser.values()).sort((a, b) => b.bestScore - a.bestScore);
}

// Used by the Game Over modal's "Your Best" comparison — this player's own
// max(final_score) for this game, this month (before the just-finished run).
export async function getMyBestScore(userId: string, gameId: string, monthKey: string): Promise<number> {
  const { data, error } = await supabase
    .from("ranked_runs")
    .select("final_score")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .eq("month_key", monthKey)
    .order("final_score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.final_score ?? 0;
}
