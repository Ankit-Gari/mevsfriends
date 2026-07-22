import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { BlockBlastMode } from '@/components/games/block-blast/Game';
import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

interface GameOverModalProps {
  mode: BlockBlastMode;
  finalScore: number;
  previousBest: number | null;
  submitStatus: 'idle' | 'submitting' | 'submitted' | 'error';
  submitError: string | null;
  coinCount?: number;
  continuing: boolean;
  onRetry: () => void;
  onContinue: () => void;
  onBackHome: () => void;
}

export function GameOverModal({
  mode,
  finalScore,
  previousBest,
  submitStatus,
  submitError,
  coinCount,
  continuing,
  onRetry,
  onContinue,
  onBackHome,
}: GameOverModalProps) {
  const isNewBest = mode === 'ranked' && previousBest != null && finalScore > previousBest;
  const canContinue = (coinCount ?? 0) >= 2;

  return (
    <ScreenBackground>
      <View style={styles.root}>
        <Card style={styles.card}>
          <Text style={styles.trophy}>{'🏆'}</Text>
          <Text style={styles.heading}>Game Over!</Text>

          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>{finalScore}</Text>

          {mode === 'ranked' && previousBest != null && (
            <View style={styles.bestRow}>
              <Text style={styles.bestLabel}>Your Best {Math.max(previousBest, finalScore)}</Text>
              {isNewBest && <Badge label="New Best!" variant="live" />}
            </View>
          )}

          <Badge label={`Mode: ${mode === 'ranked' ? 'Ranked' : 'Classic'}`} variant={mode} />

          {mode === 'ranked' && (
            // Every branch renders explicit text, including 'idle' — a
            // blank status area here is exactly what let the mobile
            // submission-skip bug look like a clean success. Never let this
            // render nothing.
            <Text style={[styles.statusText, submitStatus === 'error' && styles.errorText]}>
              {submitStatus === 'idle' && 'Not saved yet.'}
              {submitStatus === 'submitting' && 'Saving score…'}
              {submitStatus === 'submitted' && 'Score saved to the leaderboard.'}
              {submitStatus === 'error' && `Couldn't save score: ${submitError}`}
            </Text>
          )}

          {mode === 'classic' && (
            <Text style={styles.statusText}>Coins: {coinCount ?? '—'}</Text>
          )}
          {mode === 'classic' && submitError && <Text style={styles.errorText}>{submitError}</Text>}

          <View style={styles.actions}>
            {mode === 'ranked' && (
              <Button label="Retry (Same Board)" onPress={onRetry} />
            )}
            {mode === 'classic' && (
              <Button
                label={continuing ? 'Continuing…' : 'Continue (-2 coins)'}
                onPress={onContinue}
                disabled={continuing || !canContinue}
                variant={canContinue ? 'primary' : 'disabled'}
              />
            )}
            <Button label="Back to Home" variant="secondary" onPress={onBackHome} />
          </View>
        </Card>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.large,
    paddingVertical: Spacing.five,
  },
  trophy: {
    fontSize: 48,
  },
  heading: {
    color: Palette.text,
    fontSize: FontSize.title,
    fontWeight: '800',
  },
  scoreLabel: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    marginTop: Spacing.two,
  },
  scoreValue: {
    color: Palette.gold,
    fontSize: FontSize.display,
    fontWeight: '900',
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bestLabel: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  statusText: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    textAlign: 'center',
  },
  errorText: {
    color: Palette.danger,
    fontSize: FontSize.small,
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
});
