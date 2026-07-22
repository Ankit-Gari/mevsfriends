// ============================================================
// crazyismind — Edge Function: submit-ranked-score  (v1)
// The anti-cheat gate. Ranked scores can ONLY reach the DB through here.
// RLS blocks direct client inserts into ranked_runs / streak_log; this function
// runs with the service-role key (bypasses RLS) and is the sole writer.
//
// v1 validation is deliberately light (trusted 10-friend audience):
//   - authenticates the caller (their JWT)
//   - stamps seed_date/month_key from SERVER-computed IST (ignores client date)
//   - sanity-bounds the score (weak; catches absurd tampering only)
//   - stores final_board_state + move_count for manual audit
// v2 (later): accept the full move log, replay it server-side from the seed,
//   compute the authoritative score, ignore any client-sent score entirely.
//
// Deploy: supabase functions deploy submit-ranked-score
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

// Browsers send an automatic OPTIONS preflight before any cross-origin POST
// that carries an Authorization header. EVERY response (including error
// paths) needs these headers, not just the success case — a real POST can
// succeed server-side yet still get blocked client-side if only some
// responses carry CORS headers.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-side IST date. IST = fixed UTC+5:30 (no DST), so pure integer math.
function istDateParts(now: Date): { dateStr: string; monthKey: string } {
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const s = new Date(now.getTime() + IST_OFFSET_MS);
  const y = s.getUTCFullYear();
  const m = String(s.getUTCMonth() + 1).padStart(2, "0");
  const d = String(s.getUTCDate()).padStart(2, "0");
  return { dateStr: `${y}-${m}-${d}`, monthKey: `${y}-${m}` };
}

// Weak v1 sanity ceiling. Real play won't approach this; it only rejects
// obviously tampered values. Tune once you see real score distributions.
const SCORE_CEILING = 1_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // ---- Auth: identify the caller from their JWT ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "missing auth" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Client to READ the user identity (anon key + their JWT)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid auth" }), {
        status: 401,
        headers: corsHeaders,
      });
    }
    const userId = userData.user.id;

    // ---- Parse + validate payload ----
    const body = await req.json();
    const gameId: string = body.game_id;
    const score: number = body.final_score;
    const moveCount: number | null = body.move_count ?? null;
    const boardState = body.final_board_state ?? null;

    if (typeof gameId !== "string" || !gameId) {
      return new Response(JSON.stringify({ error: "bad game_id" }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!Number.isInteger(score) || score < 0 || score > SCORE_CEILING) {
      return new Response(JSON.stringify({ error: "bad score" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ---- Server-computed IST date (NEVER trust client's date) ----
    const { dateStr, monthKey } = istDateParts(new Date());

    // ---- Service-role client: bypasses RLS, sole writer to ranked tables ----
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Confirm the game exists and is live
    const { data: game, error: gameErr } = await admin
      .from("games").select("id,status").eq("id", gameId).single();
    if (gameErr || !game || game.status !== "live") {
      return new Response(JSON.stringify({ error: "game not live" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Insert the run (audit trail + leaderboard source data)
    const { error: runErr } = await admin.from("ranked_runs").insert({
      user_id: userId,
      game_id: gameId,
      seed_date: dateStr,
      month_key: monthKey,
      final_score: score,
      move_count: moveCount,
      final_board_state: boardState,
    });
    if (runErr) {
      return new Response(JSON.stringify({ error: "run insert failed" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Upsert today's streak row (idempotent via PK; multiple plays/day = one row)
    const { error: streakErr } = await admin.from("streak_log")
      .upsert({ user_id: userId, play_date: dateStr }, { onConflict: "user_id,play_date" });
    if (streakErr) {
      // Non-fatal for the score, but surface it
      return new Response(JSON.stringify({
        ok: true, warning: "score saved, streak update failed", month_key: monthKey,
      }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      ok: true, seed_date: dateStr, month_key: monthKey, final_score: score,
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (_e) {
    return new Response(JSON.stringify({ error: "bad request" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
