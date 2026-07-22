import { useCallback, useEffect, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { getProfile, Profile } from "@/lib/profile";

export function useProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  // Depend on the stable user id, not the `session` object reference — the
  // session context can still hand back a technically-new object in edge
  // cases, and keying off the object would refetch the profile every time
  // even though the signed-in user hasn't changed.
  const refetch = useCallback(() => {
    if (!userId) {
      setProfile(undefined);
      return;
    }
    getProfile(userId).then(setProfile);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, refetch };
}
