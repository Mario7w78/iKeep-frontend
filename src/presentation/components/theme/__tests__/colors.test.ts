/**
 * Los temas.
 *
 * Habia cuatro presets que compartian exactamente los mismos fondos y solo
 * cambiaban el acento: eran variantes de un tema, no temas.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { getThemePresets, getThemeById, ThemeColors } from '../colors';

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

describe('todos los presets', () => {
  it.each(getThemePresets().map((p) => [p.name, p] as const))(
    '%s define todas las ranuras',
    (_nombre, preset) => {
      for (const ranura of RANURAS) {
        expect(preset.colors[ranura]).toBeTruthy();
      }
    }
  );

  it.each(getThemePresets().map((p) => [p.name, p] as const))(
    '%s tiene texto legible sobre el fondo',
    (_nombre, preset) => {
      // 4.5:1 es el minimo de WCAG AA para texto normal.
      expect(
        contraste(preset.colors.surface, preset.colors.screenBackground)
      ).toBeGreaterThanOrEqual(4.5);
    }
  );

  it.each(getThemePresets().map((p) => [p.name, p] as const))(
    '%s tiene texto secundario todavia legible',
    (_nombre, preset) => {
      // 3:1, el minimo para texto grande y elementos de interfaz.
      expect(
        contraste(preset.colors.textSecondary, preset.colors.screenBackground)
      ).toBeGreaterThanOrEqual(3);
    }
  );
});

describe('el tema claro', () => {
  const papel = getThemeById('papel');

  it('existe', () => {
    expect(papel.id).toBe('papel');
    expect(papel.esClaro).toBe(true);
  });

  it('tiene fondo claro y texto oscuro, no al reves', () => {
    expect(luminancia(papel.colors.screenBackground)).toBeGreaterThan(0.5);
    expect(luminancia(papel.colors.surface)).toBeLessThan(0.2);
  });

  it('el acento se lee sobre su propio texto', () => {
    expect(
      contraste(papel.colors.accentText, papel.colors.accent)
    ).toBeGreaterThanOrEqual(3);
  });

  it('no es el unico: los oscuros siguen ahi', () => {
    const oscuros = getThemePresets().filter((p) => !p.esClaro);
    expect(oscuros.length).toBeGreaterThanOrEqual(4);
  });
});

describe('los temas ya no son el mismo con otro acento', () => {
  it('hay mas de un fondo distinto entre los presets', () => {
    const fondos = new Set(getThemePresets().map((p) => p.colors.screenBackground));
    expect(fondos.size).toBeGreaterThan(1);
  });
});
