import { useCallback, useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { getProfile, Profile } from "@/lib/profile";

export function useProfile() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const refetch = useCallback(() => {
    if (!session) {
      setProfile(undefined);
      return;
    }
    getProfile(session.user.id).then(setProfile);
  }, [session]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, refetch };
}
