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
    name: 'Verde',
    accent: '#8dff68',
    colors: {
      screenBackground: '#2b2d3b',
      cardBackground: '#34364d',
      cardBorder: '#525576',
      surface: '#ffffff',
      textSecondary: '#c4c4ca',
      textTertiary: '#b7b7c4',
      iconPrimary: '#aebeff',
      iconSecondary: '#a4a4a4',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#565a76',
      tabActive: '#ffffff',
      tabInactive: '#b9bac7',
      placeholder: '#D1B3FF',
    },
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    accent: '#c4a9ff',
    colors: {
      screenBackground: '#1f1b2e',
      cardBackground: '#2a2540',
      cardBorder: '#4a4270',
      surface: '#f0ecff',
      textSecondary: '#bdb0e6',
      textTertiary: '#a797d6',
      iconPrimary: '#c4a9ff',
      iconSecondary: '#9488b8',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#3f3860',
      tabActive: '#f0ecff',
      tabInactive: '#9488b8',
      placeholder: '#D1B3FF',
    },
  },
  {
    id: 'oceano',
    name: 'Océano',
    accent: '#6ea8fe',
    colors: {
      screenBackground: '#0f1b2d',
      cardBackground: '#162240',
      cardBorder: '#2a4070',
      surface: '#e8f0fe',
      textSecondary: '#a8c4ee',
      textTertiary: '#8aaee0',
      iconPrimary: '#6ea8fe',
      iconSecondary: '#7890b8',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#1e3060',
      tabActive: '#e8f0fe',
      tabInactive: '#7890b8',
      placeholder: '#D1B3FF',
    },
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    accent: '#5eead4',
    colors: {
      screenBackground: '#0f1f1f',
      cardBackground: '#162a2a',
      cardBorder: '#2a4848',
      surface: '#e0f5f2',
      textSecondary: '#97d5cc',
      textTertiary: '#7abfb5',
      iconPrimary: '#5eead4',
      iconSecondary: '#6ba8a0',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#1e3d3d',
      tabActive: '#e0f5f2',
      tabInactive: '#6ba8a0',
      placeholder: '#D1B3FF',
    },
  },
  {
    id: 'atardecer',
    name: 'Atardecer',
    accent: '#fbbf24',
    colors: {
      screenBackground: '#241b14',
      cardBackground: '#33271e',
      cardBorder: '#554435',
      surface: '#fef3e0',
      textSecondary: '#d4bc99',
      textTertiary: '#bfa67e',
      iconPrimary: '#fbbf24',
      iconSecondary: '#a09078',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#4a3a2a',
      tabActive: '#fef3e0',
      tabInactive: '#a09078',
      placeholder: '#D1B3FF',
    },
  },
  {
    id: 'rosa',
    name: 'Rosa',
    accent: '#f472b6',
    colors: {
      screenBackground: '#24141e',
      cardBackground: '#341d2b',
      cardBorder: '#55324a',
      surface: '#fce8f0',
      textSecondary: '#d4a8be',
      textTertiary: '#bf8ea8',
      iconPrimary: '#f472b6',
      iconSecondary: '#9a7890',
      error: '#ff4d4d',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#482a40',
      tabActive: '#fce8f0',
      tabInactive: '#9a7890',
      placeholder: '#D1B3FF',
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

  const value = useMemo(
    () => ({ colors, comfyColors, comfyFontColors, themeId, setThemeId }),
    [colors, themeId, setThemeId],
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
