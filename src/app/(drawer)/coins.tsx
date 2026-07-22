import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { FontSize, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { CoinTransaction, getRecentCoinActivity } from '@/lib/coins';

const REASON_LABELS: Record<string, string> = {
  start: 'Starting bonus',
  active_play: 'Active play time',
  game_complete: 'Game completion',
  continue: 'Classic continue',
};

function EarnTaskRow({ icon, title, subtitle, progress }: { icon: string; title: string; subtitle: string; progress: number }) {
  return (
    <Card style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskIcon}>{icon}</Text>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{title}</Text>
          <Text style={styles.taskSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
      </View>
    </Card>
  );
}

export default function CoinsScreen() {
  const { session } = useSession();
  const { profile } = useProfile();
  const [activity, setActivity] = useState<CoinTransaction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getRecentCoinActivity(session.user.id)
      .then(setActivity)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [session]);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <TopBar
          left={
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </Pressable>
          }
          title="Coins"
        />

        <View style={styles.content}>
          {!session && <AuthPanel />}

          {session && (
            <>
              <View style={styles.balanceBlock}>
                <Text style={styles.balanceIcon}>{'🪙'}</Text>
                <Text style={styles.balanceValue}>{profile?.coins ?? '—'}</Text>
              </View>
              <Text style={styles.mutedText}>Your Balance</Text>

              {/* Earn-rate copy resolved to concrete numbers here (the mockup's
                  "+1/5min" vs "15/30min" copy was self-contradictory, and the
                  PRD flagged this as an open decision). No real accrual backend
                  exists yet — these are illustrative/decorative until active
                  play time and game-completion tracking are actually built. */}
              <Text style={styles.sectionLabel}>Earn Coins</Text>
              <EarnTaskRow
                icon="⏱️"
                title="Active Play Time"
                subtitle="+1 coin / 5 min"
                progress={0}
              />
              <EarnTaskRow
                icon="🏁"
                title="Game Completions"
                subtitle="+2 coins per 5 games"
                progress={0}
              />

              <Text style={styles.sectionLabel}>Recent Activity</Text>
              {error && <Text style={styles.errorText}>{error}</Text>}
              {!error && activity === null && <Text style={styles.mutedText}>Loading…</Text>}
              {!error && activity?.length === 0 && <Text style={styles.mutedText}>No coin activity yet.</Text>}

              <ScrollView style={styles.list}>
                {activity?.map((tx) => (
                  <Card key={tx.id} style={styles.activityRow}>
                    <Text style={styles.activityLabel}>{REASON_LABELS[tx.reason] ?? tx.reason}</Text>
                    <Text style={[styles.activityDelta, tx.delta < 0 ? styles.negative : styles.positive]}>
                      {tx.delta > 0 ? '+' : ''}
                      {tx.delta}
                    </Text>
                  </Card>
                ))}
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
    gap: Spacing.two,
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
  balanceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  balanceIcon: {
    fontSize: FontSize.title,
  },
  balanceValue: {
    color: Palette.text,
    fontSize: FontSize.display,
    fontWeight: '900',
  },
  sectionLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    marginTop: Spacing.three,
  },
  taskCard: {
    gap: Spacing.two,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  taskIcon: {
    fontSize: FontSize.subtitle,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  taskSubtitle: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.surfaceElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.accent,
    borderRadius: 3,
  },
  list: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    borderRadius: Radius.medium,
  },
  activityLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  activityDelta: {
    fontSize: FontSize.body,
    fontWeight: '800',
  },
  positive: {
    color: '#6bdc7c',
  },
  negative: {
    color: Palette.danger,
  },
  mutedText: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    textAlign: 'center',
  },
  errorText: {
    color: Palette.danger,
    fontSize: FontSize.small,
  },
});
