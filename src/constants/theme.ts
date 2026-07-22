/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ---------------------------------------------------------------------------
// PLAYZ design system — dark, blue-purple jewel-tone, matching the direction
// already established in the Block Blast game HUD/board pass. The app is
// dark-themed only (no light-mode variant) to match the reference design;
// this deliberately does not extend the light/dark `Colors` above, which
// remains only for older screens that haven't been migrated.
// ---------------------------------------------------------------------------

// Same gradient family as components/games/block-blast/Game.tsx's page
// background — reused here, not reinvented, so the whole app reads as one
// system rather than the game screen looking like a different product.
export const Gradient = {
  page: ['#1b1140', '#2a1a5e', '#3b1c63'] as const,
};

export const Palette = {
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceElevated: 'rgba(255, 255, 255, 0.10)',
  surfaceSelected: 'rgba(124, 92, 255, 0.35)',
  border: 'rgba(196, 174, 255, 0.30)',
  borderStrong: 'rgba(196, 174, 255, 0.85)',
  panelDark: 'rgba(10, 6, 24, 0.75)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  accent: '#7c5cff',
  accentStrong: '#9b7bff',
  gold: 'rgb(240, 175, 12)',
  danger: '#ff6b6b',
} as const;

export const Radius = {
  small: 8,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const FontSize = {
  display: 40,
  title: 28,
  subtitle: 20,
  body: 16,
  small: 13,
  tiny: 11,
} as const;
