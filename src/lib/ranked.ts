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

  // supabase-js's functions.invoke() already rejects (populates `error`) on
  // any non-2xx response — this isn't a bare fetch() that silently swallows
  // HTTP failures. But don't just trust "no thrown error" as proof of
  // success either: explicitly check the body's `ok` field so a 200 with an
  // unexpected/logical-failure shape is treated as a failure too, not a
  // false success (this is what actually let the mobile bug through — the
  // caller assumed resolution == success without checking).
  if (error) throw error;
  if (!data || data.ok !== true) {
    throw new Error(data?.error ? `Score not saved: ${data.error}` : "Score not saved: unexpected response from server.");
  }
  return data;
}
