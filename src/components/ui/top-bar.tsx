import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontSize, Palette, Spacing } from '@/constants/theme';

interface TopBarProps {
  left?: ReactNode;
  title?: string;
  right?: ReactNode;
}

// Shared "icon + text" top bar pattern used across Home, drawer sub-screens,
// and the game HUD alike — left slot (hamburger or back button), optional
// centered title, right slot (stat pills, avatar, etc).
export function TopBar({ left, title, right }: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.side}>{left}</View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minWidth: 40,
  },
  sideRight: {
    marginLeft: 'auto',
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  title: {
    flex: 1,
    color: Palette.text,
    fontSize: FontSize.subtitle,
    fontWeight: '700',
    textAlign: 'center',
  },
});
