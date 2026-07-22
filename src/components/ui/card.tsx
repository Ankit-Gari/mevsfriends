import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  selected?: boolean;
}

// Shared panel look for game cards, list rows, and any other "surface on top
// of the page gradient" — every screen should use this instead of one-off
// backgroundColor/borderRadius combinations.
export function Card({ children, style, selected }: CardProps) {
  return <View style={[styles.card, selected && styles.selected, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  selected: {
    backgroundColor: Palette.surfaceSelected,
    borderColor: Palette.borderStrong,
  },
});
