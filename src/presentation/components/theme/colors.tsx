import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAppStore } from '../../../infrastructure/store/useAppStore';

/* ───────── Theme presets ───────── */

export interface ThemeColors {
  screenBackground: string;
  cardBackground: string;
  cardBorder: string;
  surface: string;
  textSecondary: string;
  textTertiary: string;
  iconPrimary: string;
  iconSecondary: string;
  error: string;
  overlayBackground: string;
  tabBarBackground: string;
  tabActive: string;
  tabInactive: string;
  placeholder: string;
  accent: string;
  accentText: string;
  secondaryAccent: string;
  secondaryAccentText: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
  accent: string; // main accent color for preview
}

const PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Grafito',
    accent: '#5ED98A',
    colors: {
      screenBackground: '#2C2E3C',
      cardBackground: '#34364A',
      cardBorder: '#40425A',
      surface: '#E8E9F0',
      textSecondary: '#9799AC',
      textTertiary: '#686B82',
      iconPrimary: '#5ED98A',
      iconSecondary: '#9799AC',
      error: '#F87171',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#34364A',
      tabActive: '#E8E9F0',
      tabInactive: '#9799AC',
      placeholder: '#9799AC',
      accent: '#5ED98A',
      accentText: '#2C2E3C',
      secondaryAccent: '#acc9ff',
      secondaryAccentText: '#2C2E3C',
    },
  },
  {
    id: 'pizarra',
    name: 'Pizarra',
    accent: '#6FA8FF',
    colors: {
      screenBackground: '#2C2E3C',
      cardBackground: '#34364A',
      cardBorder: '#40425A',
      surface: '#E8E9F0',
      textSecondary: '#9799AC',
      textTertiary: '#686B82',
      iconPrimary: '#6FA8FF',
      iconSecondary: '#9799AC',
      error: '#F87171',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#34364A',
      tabActive: '#E8E9F0',
      tabInactive: '#9799AC',
      placeholder: '#9799AC',
      accent: '#6FA8FF',
      accentText: '#2C2E3C',
      secondaryAccent: '#c8a8ff',
      secondaryAccentText: '#2C2E3C',
    },
  },
  {
    id: 'terracota',
    name: 'Terracota',
    accent: '#F2A65A',
    colors: {
      screenBackground: '#2C2E3C',
      cardBackground: '#34364A',
      cardBorder: '#40425A',
      surface: '#E8E9F0',
      textSecondary: '#9799AC',
      textTertiary: '#686B82',
      iconPrimary: '#F2A65A',
      iconSecondary: '#9799AC',
      error: '#F87171',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#34364A',
      tabActive: '#E8E9F0',
      tabInactive: '#9799AC',
      placeholder: '#9799AC',
      accent: '#F2A65A',
      accentText: '#2C2E3C',
      secondaryAccent: '#4FC1B0',
      secondaryAccentText: '#2C2E3C',
    },
  },
  {
    id: 'menta',
    name: 'Menta',
    accent: '#5FCFB0',
    colors: {
      screenBackground: '#2C2E3C',
      cardBackground: '#34364A',
      cardBorder: '#40425A',
      surface: '#E8E9F0',
      textSecondary: '#9799AC',
      textTertiary: '#686B82',
      iconPrimary: '#5FCFB0',
      iconSecondary: '#9799AC',
      error: '#F87171',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#34364A',
      tabActive: '#E8E9F0',
      tabInactive: '#9799AC',
      placeholder: '#9799AC',
      accent: '#5FCFB0',
      accentText: '#2C2E3C',
      secondaryAccent: '#9CA3C4',
      secondaryAccentText: '#2C2E3C',
    },
  },
];

/* ───────── Shared functional colors (stay same across themes) ───────── */

export const comfyColors = {
  green: '#8dff68',
  skyBlue: '#a5b2eb',
  orange: '#ffae71',
  yellow: '#e9c84a',
};

export const comfyFontColors = {
  green: '#315026',
  skyBlue: '#343950',
  orange: '#523e2f',
  yellow: '#8A5614',
};

export const activityStyles = {
  fixed: {
    gradient: ['#39105dd7', '#4b1d7de6'] as const,
    borderColor: '#5a2591',
    dayBoxColor: '#5a2591',
  },
  flexible: {
    gradient: ['#8b36d176', '#aa60e696'] as const,
    borderColor: '#8145b3',
    dayBoxColor: '#8145b3',
  },
};

export const groupColors = [
  { bg: '#E9E4FF', text: '#4A359C' },
  { bg: '#E3F6EE', text: '#1F6B55' },
  { bg: '#FFF3E3', text: '#8A5614' },
  { bg: '#F8E5FF', text: '#7A2FA0' },
  { bg: '#FDEAEA', text: '#8A3C2A' },
  { bg: '#E3F2FF', text: '#1E5B8A' },
  { bg: '#FFF0E5', text: '#9A4E1A' },
];

/* ───────── Backward-compatible static Theme ─────────
   This is a static reference that gets updated when theme changes.
   Components using `import { Theme }` at module level will NOT
   reactively update, but new renders will see the latest values. */

export const Theme: {
  colors: ThemeColors;
  comfyColors: typeof comfyColors;
  comfyFontColors: typeof comfyFontColors;
  activity: typeof activityStyles;
  groupColors: typeof groupColors;
} = {
  colors: { ...PRESETS[0].colors },
  comfyColors,
  comfyFontColors,
  activity: activityStyles,
  groupColors,
};

/* ───────── Public helpers ───────── */

export function getThemePresets(): ThemePreset[] {
  return PRESETS;
}

export function getThemeById(id: string): ThemePreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}

export function applyThemeToStaticTheme(id: string): void {
  const preset = getThemeById(id);
  Object.assign(Theme.colors, preset.colors);
  
  // Mutate comfyColors.green and comfyFontColors.green in-place for static exports
  comfyColors.green = preset.colors.accent;
  comfyFontColors.green = preset.colors.accentText;

  Theme.comfyColors.green = preset.colors.accent;
  Theme.comfyFontColors.green = preset.colors.accentText;
}

/* ───────── React Context ───────── */

export interface ThemeContextValue {
  colors: ThemeColors;
  comfyColors: typeof comfyColors;
  comfyFontColors: typeof comfyFontColors;
  themeId: string;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: PRESETS[0].colors,
  comfyColors,
  comfyFontColors,
  themeId: 'default',
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.themeId);
  const setThemeIdInStore = useAppStore((s) => s.setThemeId);

  const colors = useMemo(
    () => getThemeById(themeId).colors,
    [themeId],
  );

  const setThemeId = useCallback(
    (id: string) => {
      setThemeIdInStore(id);
      applyThemeToStaticTheme(id);
    },
    [setThemeIdInStore],
  );

  const dynamicComfyColors = useMemo(
    () => ({
      ...comfyColors,
      green: colors.accent,
    }),
    [colors.accent],
  );

  const dynamicComfyFontColors = useMemo(
    () => ({
      ...comfyFontColors,
      green: colors.accentText,
    }),
    [colors.accentText],
  );

  const value = useMemo(
    () => ({
      colors,
      comfyColors: dynamicComfyColors,
      comfyFontColors: dynamicComfyFontColors,
      themeId,
      setThemeId,
    }),
    [colors, dynamicComfyColors, dynamicComfyFontColors, themeId, setThemeId],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
