/**
 * Theme Configuration for Blueming AI Mobile App
 * 참고(front)/src/assets/main.css를 기반으로 React Native에 맞게 변환
 */

import { Platform } from 'react-native';

// ========== Colors ==========
export const Colors = {
  // Primary Colors
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  accent: '#3B82F6',

  // Background Colors
  bgDark: '#1A1A1D',
  bgCard: '#28282B',
  bgHover: '#3A3A3D',
  border: '#4A4A4F',

  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textMuted: '#828282',

  // Status Colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // Light Theme (for future implementation)
  light: {
    primary: '#0047AB',
    primaryDark: '#003380',
    bgDark: '#f9fafb',
    bgCard: '#ffffff',
    bgHover: '#f3f4f6',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    success: '#16a34a',
    error: '#dc2626',
    warning: '#d97706',
  },
};

// ========== Spacing ==========
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// ========== Border Radius ==========
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ========== Typography ==========
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  default: {
    sans: 'system-ui',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ========== Shadows ==========
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ========== Common Styles ==========
export const CommonStyles = {
  // Buttons
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLarge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // Cards
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardSmall: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },

  // Inputs
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },

  // Text
  textPrimary: {
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
  },
  textSecondary: {
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
  },
  textMuted: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
  },

  // Layout
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  row: {
    flexDirection: 'row' as const,
  },
  column: {
    flexDirection: 'column' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  spaceBetween: {
    justifyContent: 'space-between' as const,
  },

  // Badges
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    alignSelf: 'flex-start' as const,
  },
  badgePrimary: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  badgeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarSmall: {
    width: 32,
    height: 32,
  },
  avatarLarge: {
    width: 56,
    height: 56,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
};

// ========== Responsive Breakpoints ==========
export const Breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

// ========== Helper Functions ==========
export const getSpacing = (...values: (keyof typeof Spacing)[]) => {
  return values.map(v => Spacing[v]);
};

export const rgba = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// ========== Export Theme Object ==========
export const Theme = {
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  fontSizes: FontSizes,
  fontWeights: FontWeights,
  fonts: Fonts,
  shadows: Shadows,
  common: CommonStyles,
  breakpoints: Breakpoints,
};

export default Theme;
