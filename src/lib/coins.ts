import { supabase } from "@/lib/supabase";

// Classic mode only — Ranked never touches coins. `change_coins` is the sole
// writer to `coin_transactions`/`profiles.coins` (SECURITY DEFINER, validates
// the reason and that balance never goes negative), never a direct client
// update to profiles.coins.
export async function continueForCoins(): Promise<number> {
  const { data, error } = await supabase.rpc("change_coins", { p_delta: -2, p_reason: "continue" });
  if (error) throw error;
  return data;
}

export interface CoinTransaction {
  id: number;
  delta: number;
  reason: string;
  createdAt: string;
}

export async function getRecentCoinActivity(userId: string, limit = 10): Promise<CoinTransaction[]> {
  const { data, error } = await supabase
    .from("coin_transactions")
    .select("id, delta, reason, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map((row) => ({ id: row.id, delta: row.delta, reason: row.reason, createdAt: row.created_at }));
}
