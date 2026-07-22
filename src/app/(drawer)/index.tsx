import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPanel } from '@/components/auth/auth-panel';
import { GameCard } from '@/components/game-card';
import { LoadingScreen } from '@/components/loading-screen';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { getISTDateStr } from '@/constants/games/block-blast/Rng';
import { FontSize, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { getHomeGames, GameRow } from '@/lib/games';
import { getCurrentStreak } from '@/lib/streak';

function StatPill({ icon, value }: { icon: string; value: number | string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { session, loading } = useSession();
  const { profile } = useProfile();
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ready = Boolean(session && profile?.username);

  useEffect(() => {
    if (!ready || !session) return;
    getHomeGames()
      .then(setGames)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    getCurrentStreak(session.user.id, getISTDateStr())
      .then(setStreak)
      .catch(() => {});
  }, [ready, session]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <TopBar
          left={
            ready ? (
              <Pressable onPress={() => (navigation as any).openDrawer()} style={styles.hamburger}>
                <Text style={styles.hamburgerIcon}>{'☰'}</Text>
              </Pressable>
            ) : undefined
          }
          right={
            ready ? (
              <>
                <StatPill icon="🪙" value={profile?.coins ?? 0} />
                <StatPill icon="🔥" value={streak} />
              </>
            ) : undefined
          }
        />

        <View style={styles.content}>
          {!ready && <AuthPanel />}

          {ready && (
            <>
              <Text style={styles.sectionTitle}>Available Games</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {!error && games === null && <Text style={styles.mutedText}>Loading…</Text>}
              <View style={styles.gamesList}>
                {games?.map((game) => <GameCard key={game.id} game={game} />)}
              </View>
            </>
          )}
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
    gap: Spacing.three,
  },
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
  },
  hamburgerIcon: {
    color: Palette.text,
    fontSize: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
    backgroundColor: Palette.surface,
  },
  statIcon: {
    fontSize: FontSize.small,
  },
  statValue: {
    color: Palette.text,
    fontSize: FontSize.small,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: FontSize.title,
    fontWeight: '800',
  },
  gamesList: {
    gap: Spacing.three,
  },
  mutedText: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  errorText: {
    color: Palette.danger,
    fontSize: FontSize.small,
  },
});
