/**
 * El cuadro loto contra el runtime Rive mockeado.
 *
 * El reloj es fake timers con hora fija (patrón de FocusSession): las
 * fases dependen de la hora local y los bordes ya los prueba
 * dayPhase.test — acá se verifica qué reproduce el runtime y cuándo.
 */

import React from 'react';
import { AppState } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { LoopMode } from 'rive-react-native';
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

// Igual que en Sapo: la bandera permite simular "asset ausente" sin
// reimportar el mundo.
const mockFuenteVisible: { valor: number | null | undefined } = { valor: undefined };
jest.mock('../lotusAssets', () => ({
  get FUENTE_LOTUS() {
    if (mockFuenteVisible.valor === undefined) {
      mockFuenteVisible.valor = jest.requireActual('../lotusAssets').FUENTE_LOTUS;
    }
    return mockFuenteVisible.valor;
  },
}));

import { LotusLandscape } from '../LotusLandscape';

const HORA_15 = new Date('2026-08-25T15:00:00');
const HORA_22 = new Date('2026-08-25T22:00:00');

/** Captura el oyente de AppState en vez de emitir sobre él: si el mock de
 *  RN no emitiera, el test pasaría sin haber probado nada. */
let avisarForeground: ((estado: string) => void) | undefined;
const espiaAppState = () =>
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_tipo: any, oyente: any) => {
      avisarForeground = oyente;
      return { remove: jest.fn() } as any;
    });

beforeEach(() => {
  __reset();
  jest.useFakeTimers().setSystemTime(HORA_15);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('LotusLandscape', () => {
  it('a la tarde reproduce Evening una vez sobre el ambiente en bucle', async () => {
    const vista = await render(<LotusLandscape />);

    const rive = __instancias.at(-1)!;
    expect(rive.play).toHaveBeenCalledWith('Cloud_Loop', LoopMode.Loop);
    expect(rive.play).toHaveBeenCalledWith('Nenufar_Loop', LoopMode.Loop);
    expect(
      rive.play.mock.calls.filter(([nombre]: [string]) => nombre === 'Evening')
    ).toHaveLength(1);
    vista.unmount();
  });

  it('volver al primer plano en la misma fase no repite nada', async () => {
    espiaAppState();
    const vista = await render(<LotusLandscape />);

    const rive = __instancias.at(-1)!;
    const llamadasAntes = rive.play.mock.calls.length;

    await act(async () => avisarForeground!('active'));

    // Mismo horario (15h), misma fase: ni una llamada más.
    expect(rive.play).toHaveBeenCalledTimes(llamadasAntes);
    vista.unmount();
  });

  it('volver al primer plano de noche cambia a Night', async () => {
    espiaAppState();
    const vista = await render(<LotusLandscape />);

    const rive = __instancias.at(-1)!;
    rive.play.mockClear();

    jest.setSystemTime(HORA_22);
    await act(async () => avisarForeground!('active'));

    expect(rive.play).toHaveBeenCalledWith('Night', LoopMode.OneShot);
    // El ambiente no se reinicia por un cambio de fase.
    expect(rive.play).not.toHaveBeenCalledWith('Cloud_Loop', LoopMode.Loop);
    vista.unmount();
  });

  it('el fin de otra animación no avisa onFinish', async () => {
    const alTerminar = jest.fn();
    const vista = await render(<LotusLandscape onFinish={alTerminar} />);

    const rive = __instancias.at(-1)!;
    await act(async () => rive.props.onPause?.('Cloud_Loop'));
    await act(async () => rive.props.onStop?.('Evening'));

    expect(alTerminar).toHaveBeenCalledTimes(1);
    vista.unmount();
  });
});

describe('LotusLandscape sin asset', () => {
  it('un require que falla deja el hueco reservado, sin romper Home', async () => {
    mockFuenteVisible.valor = null;
    try {
      const vista = await render(<LotusLandscape testID="lotus" />);
      expect(vista.getByTestId('lotus')).toBeTruthy();
      expect(__instancias).toHaveLength(0);
    } finally {
      mockFuenteVisible.valor = undefined;
    }
  });
});
