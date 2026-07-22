import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { FontSize, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { upsertUsername } from '@/lib/profile';

// Deliberately no Gender/Age/Phone fields — the mockup shows them, but the
// product rule (no PII beyond username + whatever Google provides) means
// they must never be collected. See lib/profile.ts for the same rule at the
// data layer.
export default function ProfileScreen() {
  const { session } = useSession();
  const { profile, refetch } = useProfile();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setName(profile.name ?? '');
  }, [profile]);

  const handleSave = async () => {
    if (!session || username.trim().length === 0) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await upsertUsername(session.user.id, username.trim(), name.trim() || null);
      refetch();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <TopBar
          left={
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </Pressable>
          }
          title="Profile"
        />

        <View style={styles.content}>
          {/* Placeholder — becomes a real photo picker once avatar upload has a backend. */}
          <Pressable style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarIcon}>{'👤'}</Text>
            </View>
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditIcon}>{'✏️'}</Text>
            </View>
          </Pressable>

          <Card style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Name (Optional)</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
            {saved && !error && <Text style={styles.savedText}>Saved.</Text>}

            <Button label={busy ? 'Saving…' : 'Save / Update'} onPress={handleSave} disabled={busy} />
          </Card>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  backIcon: {
    color: Palette.text,
    fontSize: 24,
  },
  avatarWrap: {
    marginTop: Spacing.three,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Palette.surface,
    borderWidth: 3,
    borderColor: Palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 40,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 14,
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.three,
    borderRadius: Radius.large,
  },
  field: {
    gap: Spacing.one,
  },
  label: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    fontWeight: '600',
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
  errorText: {
    color: Palette.danger,
    fontSize: FontSize.small,
  },
  savedText: {
    color: Palette.accentStrong,
    fontSize: FontSize.small,
  },
});
