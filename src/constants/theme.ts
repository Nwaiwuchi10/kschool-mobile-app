/**
 * Theme palette for KSCHOOLMATE mobile application.
 * Mirrors the light and sleek modern dark mode design system.
 */

export const Colors = {
  light: {
    // Base backgrounds
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Text colors
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Primary Brand colors (KSCHOOLMATE Teal)
    primary: '#127A71',
    primaryDark: '#0D5C55',
    primaryLight: '#E0F2F1',
    primaryMint: '#D1FAE5',

    // Accent & Highlights
    cardHighlightBg: '#E0F2F1',
    cardHighlightBorder: '#127A71',
    badgeYellowBg: '#FEF3C7',
    badgeYellowText: '#D97706',

    // Status colors
    success: '#10B981',
    successBg: '#D1FAE5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    danger: '#EF4444',
    dangerBg: '#FEE2E2',
    info: '#0284C7',
    infoBg: '#E0F2FE',

    // UI inputs & components
    inputBg: '#FFFFFF',
    inputBorder: '#E5E7EB',
    inputText: '#1A1A1A',
    placeholder: '#9CA3AF',
    overlay: 'rgba(0, 0, 0, 0.55)',
    shadow: '#000000',

    // Navigation & Tabs
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#F3F4F6',
    tabIconActive: '#127A71',
    tabIconInactive: '#9CA3AF',
    headerBg: '#FAFAFA',

    // Compatibility keys
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#E0F2F1',
  },

  dark: {
    // Base backgrounds
    background: '#121212',
    surface: '#1E1E1E',
    surfaceAlt: '#262626',
    border: '#2E3135',
    borderLight: '#252525',

    // Text colors
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#121212',

    // Primary Brand colors (KSCHOOLMATE Teal with dark mode vibrant touch)
    primary: '#1AB5A7',
    primaryDark: '#127A71',
    primaryLight: 'rgba(18, 122, 113, 0.25)',
    primaryMint: 'rgba(26, 181, 167, 0.18)',

    // Accent & Highlights
    cardHighlightBg: '#1A2E2C',
    cardHighlightBorder: '#1AB5A7',
    badgeYellowBg: 'rgba(245, 158, 11, 0.18)',
    badgeYellowText: '#FBBF24',

    // Status colors
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.18)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.18)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.18)',
    info: '#38BDF8',
    infoBg: 'rgba(56, 189, 248, 0.18)',

    // UI inputs & components
    inputBg: '#1E1E1E',
    inputBorder: '#374151',
    inputText: '#F3F4F6',
    placeholder: '#6B7280',
    overlay: 'rgba(0, 0, 0, 0.75)',
    shadow: '#000000',

    // Navigation & Tabs
    tabBarBg: '#181818',
    tabBarBorder: '#2E3135',
    tabIconActive: '#1AB5A7',
    tabIconInactive: '#6B7280',
    headerBg: '#121212',

    // Compatibility keys
    backgroundElement: '#262626',
    backgroundSelected: '#1A2E2C',
  },
};

export type Theme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  half: 4,
  one: 8,
  two: 12,
  three: 16,
  four: 20,
  five: 24,
  six: 32,
  eight: 40,
};

export const Fonts = {
  mono: 'monospace',
};

