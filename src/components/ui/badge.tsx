import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Radius, Spacing } from '@/constants/theme';

export type BadgeVariant = 'live' | 'comingSoon' | 'ranked' | 'classic';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  live: Palette.accent,
  comingSoon: 'rgba(255, 255, 255, 0.15)',
  ranked: Palette.gold,
  classic: Palette.accentStrong,
};

export function Badge({ label, variant = 'live' }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: VARIANT_COLORS[variant] }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half + 2,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    color: Palette.text,
    fontSize: FontSize.tiny,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
