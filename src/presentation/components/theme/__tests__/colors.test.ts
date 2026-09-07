/**
 * El tema.
 *
 * Hubo cuatro presets que compartian exactamente los mismos fondos y solo
 * cambiaban el acento: eran variantes de un tema, no temas. Se eliminaron
 * todos menos Grafito y no quedan presets ni selector de tema.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { COLORS } from '../colors';
import { ThemeColors } from '../colors';

/** Luminancia relativa, segun WCAG. */
function luminancia(hex: string): number {
  const n = hex.replace('#', '');
  const partes = n.length === 3 ? n.split('').map((c) => c + c) : n.match(/.{2}/g)!;
  const [r, g, b] = partes.map((p) => {
    const v = parseInt(p, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const RANURAS: (keyof ThemeColors)[] = [
  'screenBackground', 'cardBackground', 'cardBorder', 'surface',
  'textSecondary', 'textTertiary', 'iconPrimary', 'iconSecondary',
  'error', 'success', 'warning', 'overlayBackground', 'tabBarBackground',
  'tabActive', 'tabInactive', 'placeholder', 'accent', 'accentText',
  'secondaryAccent', 'secondaryAccentText',
];

describe('el tema Grafito', () => {
  it('define todas las ranuras', () => {
    for (const ranura of RANURAS) {
      expect(COLORS[ranura]).toBeTruthy();
    }
  });

  it('tiene texto legible sobre el fondo', () => {
    // 4.5:1 es el minimo de WCAG AA para texto normal.
    expect(
      contraste(COLORS.surface, COLORS.screenBackground)
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('tiene texto secundario todavia legible', () => {
    // 3:1, el minimo para texto grande y elementos de interfaz.
    expect(
      contraste(COLORS.textSecondary, COLORS.screenBackground)
    ).toBeGreaterThanOrEqual(3);
  });

  it('es oscuro (fondo oscuro, texto claro)', () => {
    expect(luminancia(COLORS.screenBackground)).toBeLessThan(0.5);
    expect(luminancia(COLORS.surface)).toBeGreaterThan(0.5);
  });

  it('el acento se lee sobre su propio texto', () => {
    expect(
      contraste(COLORS.accentText, COLORS.accent)
    ).toBeGreaterThanOrEqual(3);
  });
});