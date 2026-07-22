import { supabase } from "@/lib/supabase";

export interface Profile {
  id: string;
  username: string;
  name: string | null;
  coins: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, coins")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Deliberately writes only `id`/`username`/`name` — the `profiles` table also
// has `gender`/`age`/`phone` columns from an earlier pre-pivot schema, but the
// product rule (no PII beyond username + whatever Google provides) means the
// app must never populate them. Do not add those fields here without
// re-confirming the privacy posture with the project owner.
export async function upsertUsername(userId: string, username: string, name?: string | null): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username, name: name ?? null }, { onConflict: "id" });

  if (error) throw error;
}
