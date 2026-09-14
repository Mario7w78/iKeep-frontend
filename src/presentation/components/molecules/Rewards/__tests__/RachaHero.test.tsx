/**
 * El héroe de la racha.
 *
 * Lo que importa del héroe es la semántica del hito, no la estética: el
 * número grande con la llama, la mascota celebrando con su mochila, la barra
 * dorada que anuncia el siguiente COMPONENTE CRÍTICO y la cadena semanal.
 * La mascota es decoración y se mocks: la racha no puede romperse por ella.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../../atoms/Mascot/Sapo', () => ({ Sapo: () => null }));

import { RachaHero } from '../RachaHero';

const base = {
  actual: 3 as number,
  mejor: 9 as number,
  enRiesgo: false as boolean,
  hechos: [] as string[],
  tipoSapo: 0 as 0 | 1 | 2,
};

describe('RachaHero', () => {
  it('banner, etiqueta y mejor racha', async () => {
    const vista = await render(<RachaHero {...base} />);

    expect(vista.getByText('Racha de 3 días')).toBeTruthy();
    expect(vista.getByText('días seguidos')).toBeTruthy();
    expect(vista.getByText('9')).toBeTruthy();
    expect(vista.getByText('tu mejor racha')).toBeTruthy();
  });

  it('muestra la mochila y la barra hacia el siguiente hito', async () => {
    const vista = await render(<RachaHero {...base} />);

    expect(vista.getByTestId('mochila-hito')).toBeTruthy();
    expect(vista.getByText('COMPONENTE CRÍTICO')).toBeTruthy();
    // 3 de 7: faltan 4 para el primer hito.
    expect(vista.getByText('Faltan 4 para el hito de 7.')).toBeTruthy();
  });

  it('el singular se respeta', async () => {
    const vista = await render(<RachaHero {...base} actual={1} mejor={1} />);

    expect(vista.getByText('día seguido')).toBeTruthy();
  });

  it('en riesgo avisa sin apagar la celebración', async () => {
    const vista = await render(<RachaHero {...base} enRiesgo />);

    expect(vista.getByText(/mantener tu racha/)).toBeTruthy();
  });

  it('en hito máximo no promete uno siguiente', async () => {
    const vista = await render(<RachaHero {...base} actual={100} />);

    expect(vista.getByText(/Hito máximo alcanzado/)).toBeTruthy();
  });
});