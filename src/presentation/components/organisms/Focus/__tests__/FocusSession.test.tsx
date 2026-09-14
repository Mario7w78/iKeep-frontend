/**
 * La sesion enfocada.
 *
 * Lo que importa de esta pantalla es lo que NO hace: irse de la app no la
 * cancela. Castigar la salida es castigar el azar, y castigaria sobre todo a
 * quien deja el telefono de lado para estudiar de verdad.
 */

import React from 'react';
import { AppState } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// El paisaje de la sesión y el sapo vienen de rive; en los tests se dibujan
// como un View plano (si se resolviera el paquete real, el transform de
// jest-expo no lo soporta y la suite ni cargaría).
jest.mock('../../../../components/atoms/Lotus/LotusLandscape', () => {
  const { View } = require('react-native');
  return { LotusLandscape: ({ testID, style }: any) => <View testID={testID} style={style} /> };
});
jest.mock('../../../../components/atoms/Mascot/Sapo', () => {
  const { View } = require('react-native');
  return { Sapo: ({ testID, style }: any) => <View testID={testID} style={style} /> };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { iniciar } from '../../../../../domain/services/focusSession';
import { FocusSession } from '../FocusSession';

const AHORA = new Date('2026-08-14T09:00:00.000Z');
const hace = (minutos: number) => new Date(AHORA.getTime() - minutos * 60000);

async function montar(sesion: any, props: any = {}) {
  return render(
    <FocusSession
      sesion={sesion}
      titulo="Calculo"
      onTerminar={jest.fn()}
      onDescartar={jest.fn()}
      onSalir={jest.fn()}
      {...props}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(AHORA);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('salir de la app', () => {
  it('no cancela la sesion, solo avisa', async () => {
    // Se captura el oyente que registra el componente en vez de emitir sobre
    // AppState: si el mock de RN no emitiera, el test pasaria sin haber
    // ejecutado nada y no probaria absolutamente nada.
    let avisar: ((estado: string) => void) | undefined;
    const espia = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_tipo: any, oyente: any) => {
        avisar = oyente;
        return { remove: jest.fn() } as any;
      });

    const onSalir = jest.fn();
    const onDescartar = jest.fn();
    await montar(iniciar('a1', 25, hace(5)), { onSalir, onDescartar });

    expect(avisar).toBeDefined();
    await act(async () => avisar!('background'));

    expect(onSalir).toHaveBeenCalledTimes(1);
    expect(onDescartar).not.toHaveBeenCalled();

  });

  it('volver a la app no cuenta como salida', async () => {
    let avisar: ((estado: string) => void) | undefined;
    const espia = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_tipo: any, oyente: any) => {
        avisar = oyente;
        return { remove: jest.fn() } as any;
      });

    const onSalir = jest.fn();
    await montar(iniciar('a1', 25, hace(5)), { onSalir });

    await act(async () => avisar!('active'));

    expect(onSalir).not.toHaveBeenCalled();
  });

  it('lo promete por escrito', async () => {
    // Si el usuario cree que mirar el telefono le cuesta la sesion, lo va a
    // mirar igual y encima con culpa.
    const vista = await montar(iniciar('a1', 25, hace(5)));

    expect(vista.getByTestId('sesion-promesa').props.children).toBe(
      'Puedes salir de la app. La sesión sigue acá.'
    );
  });

  it('las salidas se muestran como dato, sin reproche', async () => {
    const sesion = { ...iniciar('a1', 25, hace(5)), salidas: 3 };
    const vista = await montar(sesion);
    const texto = vista.getByTestId('sesion-salidas').props.children;

    expect(String(texto)).toContain('3');
    expect(String(texto)).not.toMatch(/perdiste|fallaste|distra/i);
  });

  it('sin salidas no dice nada', async () => {
    const vista = await montar(iniciar('a1', 25, hace(5)));

    expect(vista.queryByTestId('sesion-salidas')).toBeNull();
  });
});

describe('el tiempo que muestra', () => {
  it('sale del reloj aunque la app haya estado dormida', async () => {
    // Un contador que suma cada segundo se habria quedado en cero.
    const vista = await montar(iniciar('a1', 25, hace(18)));

    expect(vista.getByText('18 min')).toBeTruthy();
  });

  it('al llegar a la meta invita a confirmar, no marca sola', async () => {
    const vista = await montar(iniciar('a1', 25, hace(30)));

    expect(vista.getByText('Listo, la hice')).toBeTruthy();
  });

  it('antes de la meta se puede terminar igual', async () => {
    const vista = await montar(iniciar('a1', 25, hace(5)));

    expect(vista.getByText('Terminé antes')).toBeTruthy();
  });
});

describe('una sesion que quedo abierta de ayer', () => {
  it('no afirma nada por el usuario', async () => {
    const vista = await montar(iniciar('a1', 25, hace(14 * 60)));

    expect(vista.getByTestId('sesion-cerrar-caducada')).toBeTruthy();
    expect(vista.queryByTestId('sesion-terminar')).toBeNull();
  });
});

describe('cerrar sin marcar', () => {
  it('no se llama abandonar ni rendirse', async () => {
    // Cerrar sin afirmar deja la actividad sin resolver: no suma, pero
    // tampoco resta. No es un fracaso, es no haber dicho nada.
    const vista = await montar(iniciar('a1', 25, hace(5)));

    expect(vista.getByText('Cerrar sin marcar')).toBeTruthy();
  });

  it('avisa a quien corresponde', async () => {
    const onDescartar = jest.fn();
    const vista = await montar(iniciar('a1', 25, hace(5)), { onDescartar });

    await act(async () => {
      fireEvent.press(vista.getByTestId('sesion-descartar'));
    });

    expect(onDescartar).toHaveBeenCalled();
  });
});

describe('olvidarse de marcarla', () => {
  it('se puede quitar de la pantalla y la sesión queda como píldora', async () => {
    const vista = await montar(iniciar('a1', 25, hace(18)));

    expect(vista.getByTestId('sesion-enfocada')).toBeTruthy();
    expect(vista.queryByTestId('sesion-mini')).toBeNull();

    // La vista enfocada estorba si vuelvo a la app sin haberla marcado.
    await act(async () => {
      fireEvent.press(vista.getByTestId('sesion-minimizar'));
    });

    expect(vista.queryByTestId('sesion-enfocada')).toBeNull();
    expect(vista.getByTestId('sesion-mini')).toBeTruthy();
  });

  it('la píldora muestra que sigue corriendo y al tocarla vuelve la vista', async () => {
    const vista = await montar(iniciar('a1', 25, hace(5)));

    await act(async () => {
      fireEvent.press(vista.getByTestId('sesion-minimizar'));
    });

    const pildora = vista.getByTestId('sesion-mini');
    expect(pildora).toBeTruthy();
    expect(vista.getByText('5 min · en curso')).toBeTruthy();

    await act(async () => {
      fireEvent.press(pildora);
    });

    expect(vista.getByTestId('sesion-enfocada')).toBeTruthy();
    expect(vista.queryByTestId('sesion-mini')).toBeNull();
  });

  it('una sesión caducada no se minimiza: solo se puede cerrar', async () => {
    const vista = await montar(iniciar('a1', 25, hace(14 * 60)));

    expect(vista.getByTestId('sesion-cerrar-caducada')).toBeTruthy();
    expect(vista.queryByTestId('sesion-minimizar')).toBeNull();
    expect(vista.queryByTestId('sesion-mini')).toBeNull();
  });

  it('el paisaje de la sesión incluye el loto de Home', async () => {
    const vista = await montar(iniciar('a1', 25, hace(5)));

    expect(vista.getByTestId('lotus-sesion')).toBeTruthy();
  });
});
