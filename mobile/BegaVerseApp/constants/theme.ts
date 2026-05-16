import { Platform } from 'react-native';

export const BegaColors = {
  // Backgrounds
  deep:    '#030c18',
  navy:    '#061220',
  blue:    '#08213a',

  // Accent
  cyan:    '#2476B5',
  teal:    '#1A6FAF',
  aqua:    '#1E85C8',

  // Status
  green:   '#5B8A35',
  amber:   '#C08420',
  coral:   '#B82828',
  gold:    '#C8A020',

  // Bright status (charts / badges)
  greenBright: '#66BB6A',
  orangeBright: '#FFA726',
  redBright:    '#EF5350',

  // Text
  textPrimary:  '#E8F4FD',
  textMuted:    '#7BAFD4',
  textMono:     '#5BA3D0',

  // Card surfaces
  cardBg:       '#06121E',
  cardBorder:   'rgba(36, 118, 181, 0.28)',
  cardBorderStrong: 'rgba(36, 118, 181, 0.55)',

  // Overlays
  fog:          'rgba(36, 118, 181, 0.08)',
  surfaceBg:    'rgba(8, 33, 58, 0.7)',
};

export const BegaFonts = Platform.select({
  ios: { mono: 'ui-monospace', sans: 'system-ui' },
  default: { mono: 'monospace', sans: 'normal' },
  web: {
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace",
    sans: "system-ui, -apple-system, sans-serif",
  },
});

export const BegaSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Reusable card shadow for dark theme (subtle cyan glow)
export const BegaCardShadow = {
  shadowColor: '#2476B5',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 5,
};

// Legacy Colors export kept for any files that still import it
export const Colors = {
  light: {
    text: BegaColors.textPrimary,
    background: BegaColors.deep,
    tint: BegaColors.cyan,
    icon: BegaColors.textMuted,
    tabIconDefault: BegaColors.textMuted,
    tabIconSelected: BegaColors.cyan,
  },
  dark: {
    text: BegaColors.textPrimary,
    background: BegaColors.deep,
    tint: BegaColors.cyan,
    icon: BegaColors.textMuted,
    tabIconDefault: BegaColors.textMuted,
    tabIconSelected: BegaColors.cyan,
  },
};

export const Fonts = BegaFonts;
