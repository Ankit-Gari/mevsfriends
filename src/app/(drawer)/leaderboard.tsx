import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { getISTMonthKey } from '@/constants/games/block-blast/Rng';
import { FontSize, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { getLiveGames, LiveGame } from '@/lib/games';
import { getISTMonthEndCountdown } from '@/lib/ist-time';
import { getMonthlyLeaderboard, LeaderboardRow } from '@/lib/leaderboard';

const RANK_COLORS: Record<number, string> = {
  1: Palette.gold,
  2: '#c9c9d6',
  3: '#c98a4b',
};

export default function LeaderboardScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [games, setGames] = useState<LiveGame[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    getLiveGames()
      .then((liveGames) => {
        setGames(liveGames);
        setSelectedGameId((current) => current ?? liveGames[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [userId]);

  useEffect(() => {
    if (!userId || !selectedGameId) return;
    setRows(null);
    getMonthlyLeaderboard(selectedGameId, getISTMonthKey())
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [userId, selectedGameId]);

  const selectedGame = games.find((g) => g.id === selectedGameId);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <TopBar
          left={
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </Pressable>
          }
          title="Leaderboard"
        />

        <View style={styles.content}>
          {!session && <AuthPanel />}

          {session && (
            <>
              <View>
                <Pressable style={styles.dropdown} onPress={() => setPickerOpen((v) => !v)}>
                  <Text style={styles.dropdownLabel}>{selectedGame?.title ?? 'Select game'}</Text>
                  <Text style={styles.dropdownChevron}>{pickerOpen ? '▲' : '▼'}</Text>
                </Pressable>
                {pickerOpen && (
                  <Card style={styles.dropdownMenu}>
                    {games.map((game) => (
                      <Pressable
                        key={game.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedGameId(game.id);
                          setPickerOpen(false);
                        }}>
                        <Text style={styles.dropdownItemLabel}>{game.title}</Text>
                      </Pressable>
                    ))}
                  </Card>
                )}
              </View>

              <Text style={styles.resetText}>Resets in {getISTMonthEndCountdown()}</Text>

              {error && <Text style={styles.errorText}>{error}</Text>}
              {!error && rows === null && <Text style={styles.mutedText}>Loading…</Text>}
              {!error && rows?.length === 0 && <Text style={styles.mutedText}>No scores yet — be the first!</Text>}

              <ScrollView style={styles.list}>
                {rows?.map((row, index) => {
                  const rank = index + 1;
                  const isCurrentUser = row.userId === session.user.id;
                  return (
                    <Card key={row.userId} selected={isCurrentUser} style={styles.row}>
                      <Text style={[styles.rank, RANK_COLORS[rank] && { color: RANK_COLORS[rank] }]}>{rank}</Text>
                      <View style={styles.rowAvatar}>
                        <Text style={styles.rowAvatarIcon}>{'👤'}</Text>
                      </View>
                      <Text style={styles.rowUsername} numberOfLines={1}>
                        {row.username}
                      </Text>
                      <Text style={styles.rowScore}>{row.bestScore}</Text>
                    </Card>
                  );
                })}
              </ScrollView>
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  dropdownLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  dropdownChevron: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.one,
    zIndex: 10,
    padding: Spacing.one,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
  },
  dropdownItemLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
  },
  resetText: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  rank: {
    color: Palette.textSecondary,
    fontSize: FontSize.body,
    fontWeight: '800',
    width: 24,
    textAlign: 'center',
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAvatarIcon: {
    fontSize: 16,
  },
  rowUsername: {
    flex: 1,
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  rowScore: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '800',
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
