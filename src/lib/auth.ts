import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { supabase } from "@/lib/supabase";

// Required once so a native app can "complete" the browser-based OAuth
// session when it gets redirected back via the app's deep link scheme.
WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = Linking.createURL("/");

  if (Platform.OS === "web") {
    // supabase-js does a full-page redirect itself; detectSessionInUrl
    // (see lib/supabase.ts) picks the session back up when the page reloads.
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) throw error;
    return;
  }

  // Native: no `window`, so we open the OAuth URL in a browser tab ourselves
  // and hand the resulting redirect back to Supabase to mint a session.
  // NOTE: this path is implemented per Supabase's documented Expo pattern but
  // has not been runtime-tested on a native build yet (web is this project's
  // near-term ship target — see PRD Section 6).
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("No OAuth URL returned from Supabase");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") return;

  const params = new URLSearchParams(result.url.split("#")[1] ?? result.url.split("?")[1] ?? "");
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) throw new Error("OAuth redirect did not include tokens");

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) throw sessionError;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
