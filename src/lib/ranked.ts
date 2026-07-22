import { supabase } from "@/lib/supabase";

export interface SubmitRankedScoreResult {
  ok: boolean;
  seed_date?: string;
  month_key?: string;
  final_score?: number;
  error?: string;
}

// The ONLY path a Ranked score should ever take to reach the DB — RLS blocks
// direct client inserts into ranked_runs/streak_log; this Edge Function runs
// with the service-role key and stamps the server's own IST date (never
// trusts the client's). It also upserts today's streak_log row itself, so a
// successful call here is what makes the Streak screen increment too.
export async function submitRankedScore(
  gameId: string,
  finalScore: number,
  moveCount?: number,
  finalBoardState?: unknown,
): Promise<SubmitRankedScoreResult> {
  const { data, error } = await supabase.functions.invoke("submit-ranked-score", {
    body: {
      game_id: gameId,
      final_score: finalScore,
      move_count: moveCount ?? null,
      final_board_state: finalBoardState ?? null,
    },
  });

  if (error) throw error;
  return data;
}
