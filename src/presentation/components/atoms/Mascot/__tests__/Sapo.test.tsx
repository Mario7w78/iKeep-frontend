/**
 * La mascota y su máquina de estados, contra el runtime Rive mockeado.
 *
 * El mock vive en `__mocks__/rive-react-native.tsx` y jest-expo lo aplica
 * solo para todo el runner: acá solo se afirma contra él.
 */

// El store de la racha arrastra Supabase y AsyncStorage, que no tienen
// nativo en jest. Acá la racha se fija con setState: las APIs no se tocan.
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// El asset se resuelve bien en el runner (stub por moduleNameMapper); la
// prueba de "falta el asset" baja esta bandera en vez de reimportar todo.
// `undefined` = usar el real; se resuelve perezoso para esquivar el TDZ
// del factory izado de jest.mock.
const mockFuenteVisible: { valor: number | null | undefined } = { valor: undefined };
jest.mock('../sapoAssets', () => ({
  get FUENTE_SAPO() {
    if (mockFuenteVisible.valor === undefined) {
      mockFuenteVisible.valor = jest.requireActual('../sapoAssets').FUENTE_SAPO;
    }
    return mockFuenteVisible.valor;
  },
}));

import React from 'react';
import { StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { LoopMode } from 'rive-react-native';
// Los helpers del mock no existen en los tipos reales del paquete: solo
// viven en la instancia que jest resuelve en el runner.
const { __instancias, __reset } = require('rive-react-native') as {
  __instancias: Array<{
    props: Record<string, any>;
    play: ReturnType<typeof jest.fn>;
    pause: ReturnType<typeof jest.fn>;
    stop: ReturnType<typeof jest.fn>;
    reset: ReturnType<typeof jest.fn>;
  }>;
  __reset(): void;
};

import { useRewardsStore } from '../../../../../infrastructure/store/useRewardsStore';
import { Sapo } from '../Sapo';
import { ESTADOS_CON_ANIMACION, animacionDe } from '../sapoStates';

const ponerRacha = (dias: number) => {
  useRewardsStore.setState({
    racha: { actual: dias, mejor: dias, enRiesgo: false },
  });
};

beforeEach(() => {
  __reset();
});

afterEach(() => {
  useRewardsStore.setState({
    racha: { actual: 0, mejor: 0, enRiesgo: false },
  });
});

describe('animacionDe', () => {
  it.each([
    ['happy', 'Jumping'],
    ['celebrating', 'Jumping'],
  ] as const)('%i mapea a %s'.replace('%i', '%s'), (estado, esperada) => {
    expect(animacionDe(estado, 'bebé').principal).toBe(esperada);
    expect(animacionDe(estado, 'bebé').enBucle).toBe(false);
  });

  it('el saludo solo existe en el bebé: las demás etapas caen a reposo', () => {
    expect(animacionDe('waving', 'bebé').principal).toBe('Waving tail');
    expect(animacionDe('waving', 'niño').principal).toBe('Idle');
    expect(animacionDe('waving', 'adulto').principal).toBe('Idle');
  });

  it('los estados sin animación propia caen a Idle con parpadeo en bucle', () => {
    /** Degradar a reposo es preferible a no mostrar nada: la mascota
     *  sigue presente y la pantalla no cambia de forma. */
    for (const estado of ['idle', 'thinking', 'sad', 'sleeping'] as const) {
      const mapeo = animacionDe(estado, 'niño');
      expect(mapeo.principal).toBe('Idle');
      expect(mapeo.ambiental).toBe('Blinking');
      expect(mapeo.enBucle).toBe(true);
    }
  });

  it('declara qué estados tienen animación propia', () => {
    expect(ESTADOS_CON_ANIMACION).toEqual(
      expect.arrayContaining(['idle', 'waving', 'happy', 'celebrating'])
    );
  });
});

describe('artboard por etapa', () => {
  // La racha elige el artboard: los cortes los prueba frogStage.test,
  // acá se verifica que la elección llega al runtime.
  it.each([
    [3, 'Baby_Sapo'],
    [10, 'Kid_Sapo'],
    [45, 'Adult_Sapo'],
  ])('con racha %i monta %s', async (racha, artboard) => {
    ponerRacha(racha);
    await render(<Sapo />);

    expect(__instancias.at(-1)?.props.artboardName).toBe(artboard);
  });
});

describe('reproducción', () => {
  it('reposo reproduce Idle y Blinking en bucle', async () => {
    await render(<Sapo />);

    const rive = __instancias.at(-1);
    expect(rive?.play).toHaveBeenCalledWith('Idle', LoopMode.Loop);
    expect(rive?.play).toHaveBeenCalledWith('Blinking', LoopMode.Loop);
  });

  it('alegrarse reproduce Jumping una vez y vuelve al reposo al terminar', async () => {
    await render(<Sapo estado="happy" />);

    const rive = __instancias.at(-1)!;
    expect(rive.play).toHaveBeenCalledWith('Jumping', LoopMode.OneShot);
    expect(rive.play).not.toHaveBeenCalledWith('Idle', LoopMode.Loop);
    expect(rive.play).not.toHaveBeenCalledWith('Blinking', LoopMode.Loop);

    // Jumping no loopea mientras dura la alegría: termina sola.
    rive.play.mockClear();

    // El runtime avisa el fin de una OneShot con onPause (iOS) o onStop;
    // cualquiera de las dos devuelve a la mascota al reposo.
    await act(async () => rive.props.onStop?.('Jumping'));

    expect(rive.play).toHaveBeenCalledWith('Idle', LoopMode.Loop);
    expect(rive.play).toHaveBeenCalledWith('Blinking', LoopMode.Loop);
  });

  it('el fin de otra animación no cambia nada', async () => {
    await render(<Sapo estado="happy" />);

    const rive = __instancias.at(-1)!;
    await act(async () => rive.props.onStop?.('Blinking'));

    expect(rive.play).not.toHaveBeenCalledWith('Idle', LoopMode.Loop);
  });

  it('el saludo del bebé no vuelve a reposo solo: ocurre una vez y queda quieta', async () => {
    await render(<Sapo estado="waving" />);

    const rive = __instancias.at(-1)!;
    expect(rive.play).toHaveBeenCalledWith('Waving tail', LoopMode.OneShot);

    await act(async () => rive.props.onPause?.('Waving tail'));

    expect(rive.play).toHaveBeenCalledWith('Idle', LoopMode.Loop);
  });
});

describe('Sapo sin animar', () => {
  it('no llama al runtime cuando se le pide quieto', async () => {
    await render(<Sapo animar={false} />);
    await render(<Sapo estado="happy" animar={false} />);

    for (const instancia of __instancias) {
      expect(instancia.play).not.toHaveBeenCalled();
    }
  });
});

describe('Sapo sin asset', () => {
  it('un require que falla deja el hueco reservado, sin romper nada', async () => {
    /** La mascota es decoración: si falta el asset, la pantalla conserva
     *  su composición en vez de romperse o reacomodarse. */
    const montadas = __instancias.length;
    mockFuenteVisible.valor = null;
    try {
      const vista = await render(<Sapo tamano={80} />);

      const estilo = StyleSheet.flatten(vista.getByTestId('sapo').props.style);
      expect(estilo).toEqual(expect.objectContaining({ width: 80, height: 80 }));
    } finally {
      mockFuenteVisible.valor = require('../sapoAssets').FUENTE_SAPO;
    }
    // No quedó ninguna instancia de Rive montada por este render.
    expect(__instancias).toHaveLength(montadas);
  });
});
