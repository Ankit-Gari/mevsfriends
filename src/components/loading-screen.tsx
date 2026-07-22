import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { FontSize, Palette, Spacing } from '@/constants/theme';
import { ScreenBackground } from '@/components/ui/screen-background';

const APP_VERSION = '1.0.0';

export function LoadingScreen() {
  return (
    <ScreenBackground>
      <View style={styles.root}>
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>PLAYZ</Text>
          <Text style={styles.tagline}>PLAY. COMPETE. WIN.</Text>
        </View>
        <ActivityIndicator size="large" color={Palette.accentStrong} />
        <Text style={styles.version}>v{APP_VERSION}</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
  },
  logoBlock: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    color: Palette.text,
    fontSize: FontSize.display + 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  tagline: {
    color: Palette.textSecondary,
    fontSize: FontSize.small,
    letterSpacing: 2,
  },
  version: {
    position: 'absolute',
    bottom: Spacing.four,
    color: Palette.textMuted,
    fontSize: FontSize.tiny,
  },
});
