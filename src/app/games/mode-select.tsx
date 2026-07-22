import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { FontSize, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { GAME_ROUTES } from '@/lib/games';

// The missing entry point: Home's "Play" navigates here first so a mode is
// always explicitly chosen before the game route ever mounts. Without this,
// there is no way for a score to ever legitimately be Ranked or Classic.
export default function ModeSelectScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const gameRoute = gameId ? GAME_ROUTES[gameId] : undefined;

  const selectMode = (mode: 'ranked' | 'classic') => {
    if (!gameRoute) return;
    router.replace(`${gameRoute}?mode=${mode}` as any);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeIcon}>{'✕'}</Text>
        </Pressable>

        <View style={styles.content}>
          <Text style={styles.title}>Choose Mode</Text>

          {!gameRoute && <Text style={styles.mutedText}>Unknown game.</Text>}

          {gameRoute && (
            <View style={styles.optionsColumn}>
              <Pressable onPress={() => selectMode('ranked')}>
                <Card style={styles.option}>
                  <Text style={styles.optionIcon}>{'🏆'}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Ranked</Text>
                    <Text style={styles.optionSubtitle}>
                      Same board for everyone today. No coins. Counts for leaderboard & streak.
                    </Text>
                  </View>
                </Card>
              </Pressable>

              <Pressable onPress={() => selectMode('classic')}>
                <Card style={styles.option}>
                  <Text style={styles.optionIcon}>{'🎮'}</Text>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Classic</Text>
                    <Text style={styles.optionSubtitle}>
                      Practice mode. Use coins to continue. Doesn't affect leaderboard or streak.
                    </Text>
                  </View>
                </Card>
              </Pressable>
            </View>
          )}

          <Text style={styles.footnote}>Ranked = No coins · Classic = Can use coins</Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.four,
    right: Spacing.three,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surface,
    zIndex: 10,
  },
  closeIcon: {
    color: Palette.text,
    fontSize: FontSize.body,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  title: {
    color: Palette.text,
    fontSize: FontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  optionsColumn: {
    gap: Spacing.three,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.large,
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
    gap: Spacing.half,
  },
  optionTitle: {
    color: Palette.text,
    fontSize: FontSize.subtitle,
    fontWeight: '800',
  },
  optionSubtitle: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  footnote: {
    color: Palette.textMuted,
    fontSize: FontSize.tiny,
    textAlign: 'center',
  },
  mutedText: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    textAlign: 'center',
  },
});
