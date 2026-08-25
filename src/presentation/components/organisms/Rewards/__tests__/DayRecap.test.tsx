/**
 * El resumen del día que recién se cerró.
 *
 * Los contratos que importan no son visuales sino de tono y de honestidad:
 * el día difícil no lleva números, el empate no tiene ganador, y nada acá
 * toca la red — la foto ya la tomó `cerrar()`.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { DayRecap } from '../DayRecap';
import {
  ProgresoDelDia,
  Racha,
} from '../../../../infrastructure/api/RewardsApiService';

const PROGRESO: ProgresoDelDia = {
  completadas: 4,
  total: 7,
  fraccion: 4 / 7,
  terminado: true,
  completadosIds: ['a', 'b', 'c', 'd'],
  noHechasIds: ['e'],
};

const RACHA_VIVA: Racha = { actual: 5, mejor: 12, enRiesgo: false };

/** Solo el texto visible: los dígitos del stylesheet no son mensaje. */
function textosVisibles(vista: { toJSON: () => unknown }): string {
  const nodos = vista.toJSON() as Array<{
    type: string;
    props?: { children?: unknown };
  }>;
  const plano = Array.isArray(nodos) ? nodos : [nodos];
  return plano
    .filter((n) => n?.type === 'Text')
    .map((n) => String(n.props?.children ?? ''))
    .join(' ');
}

async function montar(
  props: Partial<React.ComponentProps<typeof DayRecap>> = {}
) {
  return render(
    <DayRecap
      visible
      progreso={PROGRESO}
      racha={RACHA_VIVA}
      areaDestacada="cuerpo"
      respuestaCierre="algunas"
      onDismiss={jest.fn()}
      {...props}
    />
  );
}

describe('lo que cuenta del dia', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    // Ninguna variante justifica una llamada: la data ya está en el store.
    expect((global as any).fetch).not.toHaveBeenCalled();
  });

  it('dice cuantas hizo de cuantas eran', async () => {
    const vista = await montar();

    expect(vista.getByText('Hiciste 4 de 7')).toBeTruthy();
  });

  it('muestra la racha viva tal como viene del store', async () => {
    const vista = await montar();

    expect(vista.getByText('Racha de 5 días')).toBeTruthy();
  });

  it('no presume de racha si la racha está en cero', async () => {
    const vista = await montar({
      racha: { actual: 0, mejor: 0, enRiesgo: false },
    });

    expect(vista.queryByText(/Racha de \d+/)).toBeNull();
  });

  it('nombra la única área que fue adelante', async () => {
    const vista = await montar();

    expect(vista.getByTestId('recap-area')).toBeTruthy();
    expect(vista.getByText('Cuerpo')).toBeTruthy();
  });
});

describe('el empate', () => {
  it('no corona a nadie y el resto del resumen queda intacto', async () => {
    const vista = await montar({ areaDestacada: null });

    expect(vista.queryByTestId('recap-area')).toBeNull();
    expect(vista.getByText('Hiciste 4 de 7')).toBeTruthy();
    expect(vista.getByText('Racha de 5 días')).toBeTruthy();
  });
});

describe('el día difícil', () => {
  it('no muestra ni un solo dígito en todo lo que dice', async () => {
    // Con 1 de 8 hecho, las cifras solo sirven para juzgar. El contrato de
    // tono es explícito: ausentes del mensaje principal, no maquilladas.
    const vista = await montar({
      respuestaCierre: 'dificil',
      progreso: { ...PROGRESO, completadas: 1, total: 8 },
    });

    expect(vista.queryByTestId('recap-conteo')).toBeNull();
    expect(vista.queryByText(/hiciste \d+/i)).toBeNull();
    expect(textosVisibles(vista)).not.toMatch(/\d/);
  });

  it('habla cálido y sin marco de déficit', async () => {
    const vista = await montar({ respuestaCierre: 'dificil' });

    expect(
      vista.getByText('Fue un día difícil, y lo cerraste igual.')
    ).toBeTruthy();
    expect(vista.getByText('Eso también cuenta.')).toBeTruthy();
    expect(vista.queryByTestId('recap-area')).toBeNull();
  });

  it('menciona la racha sin cifrarla', async () => {
    const vista = await montar({ respuestaCierre: 'dificil' });

    expect(vista.getByText('Y tu racha sigue contigo.')).toBeTruthy();
    expect(vista.queryByText(/Racha de \d+/)).toBeNull();
  });
});

describe('el día sin ninguna hecha', () => {
  it('renderiza estable, sin el titular numérico', async () => {
    const vista = await montar({
      progreso: {
        ...PROGRESO,
        completadas: 0,
        total: 9,
        completadosIds: [],
        fraccion: 0,
      },
      areaDestacada: null,
    });

    expect(vista.queryByText(/Hiciste/)).toBeNull();
    expect(vista.getByText('El día quedó cerrado.')).toBeTruthy();
    expect(vista.getByTestId('resumen-post-cierre')).toBeTruthy();
  });
});

describe('cómo se va', () => {
  it('un toque en cualquier lado despide, una sola vez', async () => {
    const onDismiss = jest.fn();
    const vista = await montar({ onDismiss });

    await act(async () => {
      fireEvent.press(vista.getByTestId('resumen-post-cierre'));
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('invisible no deja ni la capa', async () => {
    const vista = await montar({ visible: false });

    expect(vista.queryByTestId('resumen-post-cierre')).toBeNull();
  });
});
