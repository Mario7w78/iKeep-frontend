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
  /** Algo salio bien: completado, guardado, confirmado. */
  success: string;
  /** Algo pide atencion sin ser un error. La racha, por ejemplo. */
  warning: string;
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
  /**
   * Si el fondo es claro.
   *
   * Los componentes lo necesitan para decidir cosas que un color no resuelve
   * —el estilo de la barra de estado, si una sombra suma o ensucia—. Antes se
   * deducia comparando el fondo contra dos hex a mano, y ese chequeo nunca
   * daba true porque los cuatro presets compartian el mismo fondo.
   */
  esClaro?: boolean;
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
      success: '#5ED98A',
      warning: '#ff9f43',
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

/* ───────── Public helpers ───────── */

export function getThemePresets(): ThemePreset[] {
  return PRESETS;
}

export function getThemeById(id: string): ThemePreset {
  return PRESETS.find(p => p.id === id) || PRESETS[0];
}

/* ───────── React Context ───────── */

export interface ThemeContextValue {
  colors: ThemeColors;
  comfyColors: typeof comfyColors;
  comfyFontColors: typeof comfyFontColors;
  themeId: string;
  /** Si el tema activo tiene fondo claro. Lo decide el preset, no un hex. */
  esClaro: boolean;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: PRESETS[0].colors,
  comfyColors,
  comfyFontColors,
  themeId: 'default',
  esClaro: false,
  setThemeId: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useAppStore((s) => s.themeId);
  const setThemeIdInStore = useAppStore((s) => s.setThemeId);

  const colors = useMemo(
    () => getThemeById(themeId).colors,
    [themeId],
  );

  // Ya no hay copia estatica que sincronizar: el contexto es la unica
  // fuente, asi que cambiar el tema es cambiar el estado y nada mas.
  const setThemeId = setThemeIdInStore;

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

  // Sale del preset y no de comparar el fondo contra una lista de hex, que
  // es como estaba antes: ese chequeo nunca daba true porque los cuatro
  // presets compartian el mismo fondo.
  const esClaro = useMemo(() => getThemeById(themeId).esClaro === true, [themeId]);

  const value = useMemo(
    () => ({
      colors,
      comfyColors: dynamicComfyColors,
      comfyFontColors: dynamicComfyFontColors,
      themeId,
      esClaro,
      setThemeId,
    }),
    [colors, dynamicComfyColors, dynamicComfyFontColors, themeId, esClaro, setThemeId],
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
