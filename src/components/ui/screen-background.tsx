import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { Gradient } from '@/constants/theme';

interface ScreenBackgroundProps {
  children: ReactNode;
}

// Every screen sits on the same jewel-tone gradient — this is the one place
// that defines it, so screens don't each redeclare their own LinearGradient.
export function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <LinearGradient colors={Gradient.page} style={styles.root}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
