import { supabase } from "@/lib/supabase";

export interface LiveGame {
  id: string;
  title: string;
}

// Route for each game's play screen, keyed by `games.id`. A game with no
// entry here (e.g. newly added to the table but not yet built) simply won't
// get a working "Play" button — see home screen.
export const GAME_ROUTES: Record<string, string> = {
  block_blast: "/games/block-blast",
};

export async function getLiveGames(): Promise<LiveGame[]> {
  const { data, error } = await supabase
    .from("games")
    .select("id, title")
    .eq("status", "live");

  if (error) throw error;
  return data;
}

export interface GameRow {
  id: string;
  title: string;
  status: "live" | "coming_soon";
}

// Home/Games screens show both live and coming_soon rows — coming_soon
// titles are real rows in the `games` table (not hardcoded placeholder
// cards), so adding/removing a teased game is a data change, not a code one.
export async function getHomeGames(): Promise<GameRow[]> {
  const { data, error } = await supabase
    .from("games")
    .select("id, title, status")
    .in("status", ["live", "coming_soon"]);

  if (error) throw error;
  return data;
}
