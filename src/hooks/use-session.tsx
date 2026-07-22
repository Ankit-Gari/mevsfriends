import type { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface SessionContextValue {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextValue>({ session: null, loading: true });

// Single shared subscription for the whole app. Previously every screen
// (Home, Leaderboard, Streak, Coins, Profile, DrawerContent, AuthPanel — 8
// call sites) called a `useSession()` that set up its OWN
// supabase.auth.onAuthStateChange listener and OWN local state. Auth events
// fire more than once per session (initial session, token refresh, etc.),
// each handing back a *new* session object even for the same logged-in
// user — so every one of those 8 independent listeners re-fired its own
// downstream effects on every event, multiplying into dozens of duplicate
// profiles/games/streak fetches for a single screen visit. This provider
// makes the subscription happen exactly once, and only produces a new
// `session` reference when the actual signed-in user changes.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession((prev) => (prev?.user.id === newSession?.user.id ? prev : newSession));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <SessionContext.Provider value={{ session, loading }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
