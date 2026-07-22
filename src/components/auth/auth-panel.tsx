import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { signInWithGoogle, signOut } from '@/lib/auth';
import { upsertUsername } from '@/lib/profile';

// Minimal, functional-only auth block proving the Google sign-in + username
// upsert wiring end to end. Shown wherever a screen needs a "not signed in
// yet" fallback (Home, Leaderboard, Streak).
export function AuthPanel() {
  const { session, loading } = useSession();
  const { profile, refetch } = useProfile();
  const username = profile === undefined ? undefined : (profile?.username ?? null);
  const [usernameInput, setUsernameInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setBusy(true);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handleSetUsername = useCallback(async () => {
    if (!session || usernameInput.trim().length === 0) return;
    setError(null);
    setBusy(true);
    try {
      await upsertUsername(session.user.id, usernameInput.trim(), session.user.user_metadata?.full_name ?? null);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [session, usernameInput]);

  if (loading) {
    return (
      <Card style={styles.panel}>
        <ActivityIndicator color={Palette.accentStrong} />
      </Card>
    );
  }

  return (
    <Card style={styles.panel}>
      {!session && (
        <Button label={busy ? 'Signing in…' : 'Sign in with Google'} onPress={handleSignIn} disabled={busy} />
      )}

      {session && username === null && (
        <>
          <TextInput
            value={usernameInput}
            onChangeText={setUsernameInput}
            placeholder="Choose a username"
            placeholderTextColor={Palette.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <Button label={busy ? 'Saving…' : 'Save'} onPress={handleSetUsername} disabled={busy} />
        </>
      )}

      {session && username && (
        <>
          <Text style={styles.signedInText}>Signed in as {username}</Text>
          <Button label="Sign out" variant="secondary" onPress={handleSignOut} disabled={busy} />
        </>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    borderRadius: Radius.large,
  },
  input: {
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    color: Palette.text,
    fontSize: FontSize.body,
  },
  signedInText: {
    color: Palette.text,
    fontSize: FontSize.body,
  },
  errorText: {
    color: Palette.danger,
    fontSize: FontSize.small,
  },
});
