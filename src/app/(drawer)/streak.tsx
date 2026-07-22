import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPanel } from '@/components/auth/auth-panel';
import { Card } from '@/components/ui/card';
import { ScreenBackground } from '@/components/ui/screen-background';
import { TopBar } from '@/components/ui/top-bar';
import { getISTDateStr, getISTMonthKey } from '@/constants/games/block-blast/Rng';
import { FontSize, MaxContentWidth, Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/hooks/use-session';
import { getISTMonthEndCountdown } from '@/lib/ist-time';
import {
  DayMark,
  getCurrentStreak,
  getLast7Days,
  getLongestStreak,
  getStreakLeaderboard,
  StreakLeaderboardRow,
} from '@/lib/streak';

const RANK_COLORS: Record<number, string> = {
  1: Palette.gold,
  2: '#c9c9d6',
  3: '#c98a4b',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function StreakScreen() {
  const { session } = useSession();
  const [streak, setStreak] = useState<number | null>(null);
  const [longestStreak, setLongestStreak] = useState<number | null>(null);
  const [days, setDays] = useState<DayMark[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<StreakLeaderboardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const todayIST = getISTDateStr();

    getCurrentStreak(session.user.id, todayIST).then(setStreak).catch((err) => setError(String(err)));
    getLongestStreak(session.user.id, getISTMonthKey()).then(setLongestStreak).catch(() => {});
    getLast7Days(session.user.id).then(setDays).catch((err) => setError(String(err)));
    getStreakLeaderboard(todayIST).then(setLeaderboard).catch((err) => setError(String(err)));
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
          title="Streak"
        />

        <View style={styles.content}>
          {!session && <AuthPanel />}

          {session && (
            <>
              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.streakHero}>
                <Text style={styles.flame}>{'🔥'}</Text>
                <Text style={styles.streakNumber}>{streak ?? '—'}</Text>
              </View>
              <Text style={styles.mutedText}>Current Streak</Text>

              <Card style={styles.longestCard}>
                <Text style={styles.mutedText}>Longest Streak</Text>
                <Text style={styles.longestValue}>{longestStreak ?? '—'} days</Text>
              </Card>

              <Text style={styles.sectionLabel}>Past 7 Days</Text>
              <View style={styles.daysRow}>
                {days?.map((day, i) => (
                  <View key={day.date} style={styles.dayColumn}>
                    <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                    <View style={[styles.dot, day.played && styles.dotFilled]}>
                      {day.played && <Text style={styles.dotIcon}>{'🔥'}</Text>}
                    </View>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionLabel}>Streak Leaderboard</Text>
              <Text style={styles.resetText}>Resets in {getISTMonthEndCountdown()}</Text>

              {!error && leaderboard === null && <Text style={styles.mutedText}>Loading…</Text>}

              <ScrollView style={styles.list}>
                {leaderboard?.map((row, index) => {
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
                      <Text style={styles.rowStreak}>{row.streak}</Text>
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
  streakHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  flame: {
    fontSize: FontSize.title,
  },
  streakNumber: {
    color: Palette.text,
    fontSize: FontSize.display,
    fontWeight: '900',
  },
  longestCard: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  longestValue: {
    color: Palette.text,
    fontSize: FontSize.subtitle,
    fontWeight: '800',
  },
  sectionLabel: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '700',
    marginTop: Spacing.three,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  dayLabel: {
    color: Palette.textMuted,
    fontSize: FontSize.tiny,
    fontWeight: '700',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: 'rgba(240, 175, 12, 0.2)',
    borderColor: Palette.gold,
  },
  dotIcon: {
    fontSize: FontSize.small,
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
  rowStreak: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '800',
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
