import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FontSize, Palette, Spacing } from '@/constants/theme';
import { GameRow } from '@/lib/games';

interface GameCardProps {
  game: GameRow;
}

// Shared by Home and Games screens — one card component, not duplicated.
export function GameCard({ game }: GameCardProps) {
  const isLive = game.status === 'live';

  return (
    <Card style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.title}>{game.title}</Text>
        <Badge label={isLive ? 'Live' : 'Coming Soon'} variant={isLive ? 'live' : 'comingSoon'} />
      </View>
      <Button
        label={isLive ? 'Play' : 'Locked'}
        variant={isLive ? 'primary' : 'disabled'}
        onPress={() => router.push(`/games/mode-select?gameId=${game.id}` as any)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  info: {
    gap: Spacing.one,
  },
  title: {
    color: Palette.text,
    fontSize: FontSize.body,
    fontWeight: '700',
  },
});
