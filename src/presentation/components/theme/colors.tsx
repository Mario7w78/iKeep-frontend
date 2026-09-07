import React, { createContext, useContext, useMemo } from 'react';

/* ───────── Theme ───────── */

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

export const COLORS: ThemeColors = {
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
};

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

/* ───────── React Context ───────── */

export interface ThemeContextValue {
  colors: ThemeColors;
  comfyColors: typeof comfyColors;
  comfyFontColors: typeof comfyFontColors;
  /** El tema activo tiene fondo claro. Hoy no: el unico tema es oscuro. */
  esClaro: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: COLORS,
  comfyColors,
  comfyFontColors,
  esClaro: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dynamicComfyColors = useMemo(
    () => ({
      ...comfyColors,
      green: COLORS.accent,
    }),
    [],
  );

  const dynamicComfyFontColors = useMemo(
    () => ({
      ...comfyFontColors,
      green: COLORS.accentText,
    }),
    [],
  );

  // Solo hay un tema (Grafito, oscuro): esClaro siempre es false. Se conserva
  // en el contexto para que los consumidores (barra de estado, sombras) sigan
  // decidiendo igual si el dia de mañana vuelve un tema claro.
  const esClaro = false;

  const value = useMemo(
    () => ({
      colors: COLORS,
      comfyColors: dynamicComfyColors,
      comfyFontColors: dynamicComfyFontColors,
      esClaro,
    }),
    [dynamicComfyColors, dynamicComfyFontColors],
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
