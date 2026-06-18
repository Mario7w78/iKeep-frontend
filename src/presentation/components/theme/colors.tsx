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
    name: 'Menta',
    accent: '#7CE0C3',
    colors: {
      screenBackground: '#12161A',
      cardBackground: '#1A2126',
      cardBorder: '#2E3A44',
      surface: '#E3E9EC',
      textSecondary: '#8A99A5',
      textTertiary: '#5C6B77',
      iconPrimary: '#7CE0C3',
      iconSecondary: '#8A99A5',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#1A2126',
      tabActive: '#E3E9EC',
      tabInactive: '#5C6B77',
      placeholder: '#8A99A5',
      accent: '#7CE0C3',
      accentText: '#12161A',
      secondaryAccent: '#8EB2FF',
      secondaryAccentText: '#12161A',
    },
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    accent: '#C1B6E6',
    colors: {
      screenBackground: '#14121F',
      cardBackground: '#1C192E',
      cardBorder: '#2C2749',
      surface: '#F1EFF7',
      textSecondary: '#9893B0',
      textTertiary: '#6A6582',
      iconPrimary: '#C1B6E6',
      iconSecondary: '#9893B0',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#1C192E',
      tabActive: '#F1EFF7',
      tabInactive: '#6A6582',
      placeholder: '#9893B0',
      accent: '#C1B6E6',
      accentText: '#14121F',
      secondaryAccent: '#FFB7B2',
      secondaryAccentText: '#14121F',
    },
  },
  {
    id: 'atardecer',
    name: 'Ámbar',
    accent: '#EAA368',
    colors: {
      screenBackground: '#161412',
      cardBackground: '#201C1A',
      cardBorder: '#302A27',
      surface: '#F4F0EC',
      textSecondary: '#9C938C',
      textTertiary: '#6E655F',
      iconPrimary: '#EAA368',
      iconSecondary: '#9C938C',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.5)',
      tabBarBackground: '#201C1A',
      tabActive: '#F4F0EC',
      tabInactive: '#6E655F',
      placeholder: '#9C938C',
      accent: '#EAA368',
      accentText: '#161412',
      secondaryAccent: '#7CC1E0',
      secondaryAccentText: '#161412',
    },
  },
  {
    id: 'monocroma',
    name: 'Monocroma',
    accent: '#FFFFFF',
    colors: {
      screenBackground: '#121214',
      cardBackground: '#1A1A1E',
      cardBorder: '#2D2D34',
      surface: '#EAEAEA',
      textSecondary: '#8E8E93',
      textTertiary: '#5A5A5F',
      iconPrimary: '#FFFFFF',
      iconSecondary: '#8E8E93',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#1A1A1E',
      tabActive: '#FFFFFF',
      tabInactive: '#5A5A5F',
      placeholder: '#8E8E93',
      accent: '#FFFFFF',
      accentText: '#121214',
      secondaryAccent: '#D1D1D6',
      secondaryAccentText: '#121214',
    },
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda',
    accent: '#4ADE80',
    colors: {
      screenBackground: '#1E2B24',
      cardBackground: '#27382E',
      cardBorder: '#354D3F',
      surface: '#E3F2EB',
      textSecondary: '#8CA699',
      textTertiary: '#506659',
      iconPrimary: '#4ADE80',
      iconSecondary: '#8CA699',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#27382E',
      tabActive: '#E3F2EB',
      tabInactive: '#506659',
      placeholder: '#8CA699',
      accent: '#4ADE80',
      accentText: '#1E2B24',
      secondaryAccent: '#FFC296',
      secondaryAccentText: '#1E2B24',
    },
  },
  {
    id: 'claro_menta',
    name: 'Menta Radiante',
    accent: '#10B981',
    colors: {
      screenBackground: '#F1F6F3',
      cardBackground: '#FFFFFF',
      cardBorder: '#DFE6E1',
      surface: '#162E21',
      textSecondary: '#5A7365',
      textTertiary: '#7A9485',
      iconPrimary: '#10B981',
      iconSecondary: '#5A7365',
      error: '#EF4444',
      overlayBackground: 'rgba(0,0,0,0.3)',
      tabBarBackground: '#FFFFFF',
      tabActive: '#162E21',
      tabInactive: '#7A9485',
      placeholder: '#7A9485',
      accent: '#10B981',
      accentText: '#FFFFFF',
      secondaryAccent: '#D1FAE5',
      secondaryAccentText: '#162E21',
    },
  },
  {
    id: 'asfalto',
    name: 'Asfalto',
    accent: '#7CE0C3',
    colors: {
      screenBackground: '#222222',
      cardBackground: '#2C2C2C',
      cardBorder: '#3C3C3C',
      surface: '#E5E5E5',
      textSecondary: '#999999',
      textTertiary: '#666666',
      iconPrimary: '#7CE0C3',
      iconSecondary: '#999999',
      error: '#FF6B6B',
      overlayBackground: 'rgba(0,0,0,0.6)',
      tabBarBackground: '#2C2C2C',
      tabActive: '#E5E5E5',
      tabInactive: '#666666',
      placeholder: '#999999',
      accent: '#7CE0C3',
      accentText: '#222222',
      secondaryAccent: '#8EB2FF',
      secondaryAccentText: '#222222',
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
