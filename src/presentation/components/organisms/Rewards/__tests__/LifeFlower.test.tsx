/**
 * Los petalos.
 *
 * La regla que impide que esto se vuelva un reproche: la flor muestra la
 * FORMA de tu vida, no la califica.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { construirFlor } from '../../../../../domain/services/lifeBalance';
import { LifeFlower } from '../LifeFlower';

const NADA = { estudio: 0, trabajo: 0, cuerpo: 0, vinculos: 0, yo: 0 };

describe('sin nada hecho', () => {
  it('explica para que sirve en vez de mostrar ceros', async () => {
    // Cinco barras vacias no ensenan nada y parecen un error.
    const vista = await render(<LifeFlower flor={construirFlor(NADA, NADA)} />);

    expect(vista.getByTestId('flor-vacia')).toBeTruthy();
    expect(vista.queryByTestId('flor')).toBeNull();
  });
});

describe('con actividad', () => {
  const flor = construirFlor(
    { estudio: 30, trabajo: 10, cuerpo: 6, vinculos: 0, yo: 4 },
    { estudio: 20, trabajo: 8, cuerpo: 6, vinculos: 0, yo: 5 }
  );

  it('dibuja los cinco petalos, incluido el que esta en cero', async () => {
    // El area en blanco es justamente lo que la pantalla existe para mostrar.
    const vista = await render(<LifeFlower flor={flor} />);

    for (const area of ['estudio', 'trabajo', 'cuerpo', 'vinculos', 'yo']) {
      expect(vista.getByTestId(`petalo-${area}`)).toBeTruthy();
    }
  });

  it('deja el hueco para la flor ilustrada', async () => {
    const vista = await render(<LifeFlower flor={flor} />);

    expect(vista.getByTestId('hueco-flor')).toBeTruthy();
  });

  it('nombra el area mas floja sin reprochar', async () => {
    const vista = await render(<LifeFlower flor={flor} />);
    const texto = vista.getByTestId('flor-observacion').props.children.join('');

    expect(texto).toContain('vínculos');
    expect(texto).not.toMatch(/deberías|descuidaste|mal|poco compromiso/i);
  });

  it('dice que lo que abre la flor es el reparto, no el volumen', async () => {
    // Sin decirlo, un usuario con un solo petalo enorme no entiende por que
    // su flor sigue cerrada y lo lee como que la app no lo reconoce.
    const vista = await render(<LifeFlower flor={flor} />);

    expect(
      vista.getByText('Lo que abre la flor no es cuánto haces, es cuán repartido está.')
    ).toBeTruthy();
  });

  it('no nombra nada cuando esta parejo', async () => {
    const pareja = construirFlor(
      { estudio: 8, trabajo: 8, cuerpo: 8, vinculos: 8, yo: 8 },
      { estudio: 4, trabajo: 4, cuerpo: 4, vinculos: 4, yo: 4 }
    );

    const vista = await render(<LifeFlower flor={pareja} />);

    expect(vista.queryByTestId('flor-observacion')).toBeNull();
  });
});
