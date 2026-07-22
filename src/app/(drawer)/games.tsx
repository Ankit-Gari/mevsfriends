import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameCard } from '@/components/game-card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { FontSize, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { getHomeGames, GameRow } from '@/lib/games';

// Category tabs are decorative for now — only one real category exists, so
// filtering isn't wired up. "All" is the only one that does anything.
const CATEGORIES = ['All', 'Puzzle', 'Arcade', 'Strategy'];

export default function GamesScreen() {
  const [games, setGames] = useState<GameRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    getHomeGames()
      .then(setGames)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <TopBar
          left={
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </Pressable>
          }
          title="Games"
        />

        <View style={styles.content}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => (
              <Pressable key={c} onPress={() => setCategory(c)} style={[styles.categoryTab, category === c && styles.categoryTabSelected]}>
                <Text style={[styles.categoryLabel, category === c && styles.categoryLabelSelected]}>{c}</Text>
              </Pressable>
            ))}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {!error && games === null && <Text style={styles.mutedText}>Loading…</Text>}

          <View style={styles.gamesList}>
            {games?.map((game) => <GameCard key={game.id} game={game} />)}
          </View>
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
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  categoryTab: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    backgroundColor: Palette.surface,
  },
  categoryTabSelected: {
    backgroundColor: Palette.accent,
  },
  categoryLabel: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    fontWeight: '600',
  },
  categoryLabelSelected: {
    color: Palette.text,
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
