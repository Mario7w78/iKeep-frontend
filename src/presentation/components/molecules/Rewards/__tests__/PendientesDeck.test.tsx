/**
 * El mazo de pendientes (estilo Tinder).
 *
 * Cada carta es UNA actividad sin responder y cada gesto es UNA respuesta.
 * Lo que importa: que el gesto llegue a la salida correcta (hecha, no hecha,
 * reprogramada, saltada), que la carta salga del mazo y que al vaciarse el
 * mazo se cierre solo. La mascota es decoración y se mocks.
 */

import React from 'react';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { Animated, PanResponder } from 'react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { PendientesDeck, TarjetaPendiente } from '../PendientesDeck';

const CARTAS: TarjetaPendiente[] = [
  { id: 'act-1', origen: 'pasado', titulo: 'Dentista', descripcion: 'Ayer', desde: '2026-09-12' },
  { id: 'act-2', origen: 'hoy', titulo: 'Correr', descripcion: 'Hoy', desde: '2026-09-13' },
];

const mocks = {
  onHecha: jest.fn().mockResolvedValue(undefined),
  onNoHecha: jest.fn().mockResolvedValue(undefined),
  onReprogramar: jest.fn().mockResolvedValue(undefined),
  onSaltar: jest.fn(),
  onCerrar: jest.fn(),
};

function montar(cartas: TarjetaPendiente[] = CARTAS, visible = true) {
  return render(
    <PendientesDeck visible={visible} cartas={cartas} {...mocks} />
  );
}

beforeEach(() => {
  for (const clave of Object.keys(mocks) as (keyof typeof mocks)[]) {
    mocks[clave].mockClear();
  }
});

const tocar = async (vista: any, id: string) => {
  await act(async () => {
    fireEvent.press(vista.getByTestId(id));
  });
};

/** Deja terminar el vuelo de la carta (real ~220 ms + margen). */
const terminar = async () => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  await act(async () => {});
};

/** Arma el touchHistory que PanResponder usa para calcular dx/dy. */
function touchEn(x: number, y: number, prevX = x, prevY = y, tsPrev = 0, ts = 1) {
  return {
    touchBank: [
      {
        touchActive: true,
        startPageX: 0,
        startPageY: 0,
        startTimeStamp: 0,
        currentPageX: x,
        currentPageY: y,
        currentTimeStamp: ts,
        previousPageX: prevX,
        previousPageY: prevY,
        previousTimeStamp: tsPrev,
      },
    ],
    numberActiveTouches: 1,
    indexOfSingleActiveTouch: 0,
    mostRecentTimeStamp: ts,
  };
}

const eventoEn = (x: number, y: number, prevX?: number, prevY?: number, tsPrev?: number, ts?: number) => ({
  touchHistory: touchEn(x, y, prevX, prevY, tsPrev, ts),
});

/** Desliza la carta de arriba por el PanResponder real: grant->move->release. */
const deslizar = async (vista: any, dx: number, dy = 0) => {
  const carta = vista.getByTestId('carta-tope');
  await act(async () => {
    carta.props.onResponderGrant(eventoEn(0, 0));
    carta.props.onResponderMove(eventoEn(dx, dy, 0, 0, 1, 2));
  });
  await act(async () => {
    carta.props.onResponderRelease(eventoEn(dx, dy, dx, dy, 2, 3));
  });
  await terminar();
};

describe('PendientesDeck', () => {
  it('sin visible no se monta', async () => {
    const vista = await montar(CARTAS, false);

    expect(vista.queryByTestId('mazo-pendientes')).toBeNull();
  });

  it('muestra la primera carta, las que quedan y los cuatro gestos', async () => {
    const vista = await montar();

    expect(vista.getByText('Dentista')).toBeTruthy();
    expect(vista.getByText('Ayer')).toBeTruthy();
    expect(vista.getByText('Quedan 2 actividades.')).toBeTruthy();
    expect(vista.getByTestId('pendiente-hecha')).toBeTruthy();
    expect(vista.getByTestId('pendiente-no-hecha')).toBeTruthy();
    expect(vista.getByTestId('pendiente-reprogramar')).toBeTruthy();
    expect(vista.getByTestId('pendiente-saltar')).toBeTruthy();
  });

  it('habla en singular cuando queda una sola carta', async () => {
    const vista = await montar([CARTAS[0]]);

    expect(vista.getByText('Queda 1 actividad.')).toBeTruthy();
  });

  it('«La hice»: avisa y pasa a la siguiente carta', async () => {
    const vista = await montar();

    fireEvent.press(vista.getByTestId('pendiente-hecha'));
    await terminar();

    expect(mocks.onHecha).toHaveBeenCalledWith(CARTAS[0]);
    const tope = within(vista.getByTestId('carta-tope'));
    expect(tope.getByText('Correr')).toBeTruthy();
    expect(tope.getByText('Hoy')).toBeTruthy();
  });

  it('«No la hice» avisa sin inventar nada', async () => {
    const vista = await montar();

    fireEvent.press(vista.getByTestId('pendiente-no-hecha'));
    await terminar();

    expect(mocks.onNoHecha).toHaveBeenCalledWith(CARTAS[0]);
    expect(mocks.onHecha).not.toHaveBeenCalled();
  });

  it('«Saltar» no toca ninguna salida', async () => {
    const vista = await montar();

    fireEvent.press(vista.getByTestId('pendiente-saltar'));
    await terminar();

    expect(mocks.onSaltar).toHaveBeenCalledWith(CARTAS[0]);
    expect(mocks.onHecha).not.toHaveBeenCalled();
    expect(mocks.onNoHecha).not.toHaveBeenCalled();
    expect(mocks.onReprogramar).not.toHaveBeenCalled();
  });

  it('deslizar a la derecha responde «La hice» y pasa a la siguiente carta', async () => {
    const vista = await montar();

    await deslizar(vista, 300);

    expect(mocks.onHecha).toHaveBeenCalledWith(CARTAS[0]);
    const tope = within(vista.getByTestId('carta-tope'));
    expect(tope.getByText('Correr')).toBeTruthy();
  });

  it('deslizar a la izquierda responde «No la hice»', async () => {
    const vista = await montar();

    await deslizar(vista, -300);

    expect(mocks.onNoHecha).toHaveBeenCalledWith(CARTAS[0]);
    expect(mocks.onHecha).not.toHaveBeenCalled();
  });

  it('deslizar hacia arriba salta sin tocar hecha/no-hecha', async () => {
    const vista = await montar();

    await deslizar(vista, 0, -300);

    expect(mocks.onSaltar).toHaveBeenCalledWith(CARTAS[0]);
    expect(mocks.onHecha).not.toHaveBeenCalled();
    expect(mocks.onNoHecha).not.toHaveBeenCalled();
  });

  it('un desliz corto devuelve la carta sin responder', async () => {
    const vista = await montar();

    await deslizar(vista, 40);

    expect(mocks.onHecha).not.toHaveBeenCalled();
    expect(mocks.onNoHecha).not.toHaveBeenCalled();
    expect(vista.getByText('Dentista')).toBeTruthy();
  });

  it('reprogramar despliega destinos; elegir uno mueve la carta', async () => {
    const vista = await montar();

    await tocar(vista, 'pendiente-reprogramar');

    const destinos = vista.getAllByTestId(/^pendiente-destino-\d/);
    expect(destinos.length).toBeGreaterThanOrEqual(7);

    await act(async () => {
      fireEvent.press(destinos[0]);
    });
    await terminar();

    expect(mocks.onReprogramar).toHaveBeenCalledWith(CARTAS[0], expect.any(String));
  });

  it('reprogramar se puede cancelar sin mover nada', async () => {
    const vista = await montar();

    await tocar(vista, 'pendiente-reprogramar');
    await tocar(vista, 'pendiente-destino-volver');

    expect(vista.queryAllByTestId(/^pendiente-destino-\d/)).toHaveLength(0);
    expect(mocks.onReprogramar).not.toHaveBeenCalled();
  });

  it('al terminar la última carta el mazo se cierra solo', async () => {
    const vista = await montar([CARTAS[0]]);

    fireEvent.press(vista.getByTestId('pendiente-hecha'));
    await terminar();
    await new Promise((resolve) => setTimeout(resolve, 400));
    await act(async () => {});

    expect(mocks.onCerrar).toHaveBeenCalledTimes(1);
  });
});