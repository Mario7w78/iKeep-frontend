/**
 * El tiempo de viaje.
 *
 * Eran dos campos llamados "Traslado antes" y "Traslado despues" —antes y
 * despues de que—, y en ninguna parte se veia que hacian.
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

import { TravelTimeField } from '../TravelTimeField';

const INICIO = new Date(2026, 7, 11, 20, 0);
const FIN = new Date(2026, 7, 11, 22, 0);

function pintar(props: any = {}) {
  return render(
    <TravelTimeField
      inicio={INICIO}
      fin={FIN}
      ida={null}
      vuelta={null}
      onCambiarIda={jest.fn()}
      onCambiarVuelta={jest.fn()}
      {...props}
    />
  );
}

async function tocar(vista: any, testID: string) {
  await act(async () => {
    fireEvent.press(vista.getByTestId(testID));
  });
}

describe('sin viaje', () => {
  it('pregunta en vez de mostrar dos campos vacios', async () => {
    const vista = await pintar();

    expect(vista.getByText('¿Tienes que viajar para llegar?')).toBeTruthy();
  });

  it('no muestra opciones hasta que hagan falta', async () => {
    const vista = await pintar();

    expect(vista.queryByTestId('travel-ida')).toBeNull();
  });

  it('activarlo propone un valor razonable en vez de cero', async () => {
    // Empezar en cero obliga a un toque mas para decir algo que ya se dijo.
    const ida = jest.fn();
    const vuelta = jest.fn();
    const vista = await pintar({ onCambiarIda: ida, onCambiarVuelta: vuelta });

    await tocar(vista, 'travel-enable');

    expect(ida).toHaveBeenCalledWith(15);
    expect(vuelta).toHaveBeenCalledWith(15);
  });
});

describe('con viaje', () => {
  it('la vuelta sigue a la ida sin preguntarla dos veces', async () => {
    const vuelta = jest.fn();
    const vista = await pintar({ ida: 15, vuelta: 15, onCambiarVuelta: vuelta });

    await tocar(vista, 'travel-ida-30');

    expect(vuelta).toHaveBeenCalledWith(30);
  });

  it('dice a que hora hay que salir, que es la pregunta real', async () => {
    const vista = await pintar({ ida: 20, vuelta: 20 });

    // Empieza 20:00 y termina 22:00; con 20 minutos de viaje.
    expect(vista.getByText(/Sales 19:40/)).toBeTruthy();
    expect(vista.getByText(/22:20/)).toBeTruthy();
  });

  it('se puede quitar', async () => {
    const ida = jest.fn();
    const vuelta = jest.fn();
    const vista = await pintar({ ida: 15, vuelta: 15, onCambiarIda: ida, onCambiarVuelta: vuelta });

    await tocar(vista, 'travel-clear');

    expect(ida).toHaveBeenCalledWith(0);
    expect(vuelta).toHaveBeenCalledWith(0);
  });
});

describe('cuando la vuelta es distinta', () => {
  it('el segundo campo esta escondido hasta que se pide', async () => {
    // Quien nunca los separo no tiene por que enterarse de que puede.
    const vista = await pintar({ ida: 15, vuelta: 15 });

    expect(vista.queryByTestId('travel-vuelta')).toBeNull();
  });

  it('al pedirlo aparece', async () => {
    const vista = await pintar({ ida: 15, vuelta: 15 });

    await tocar(vista, 'travel-split');

    expect(vista.getByTestId('travel-vuelta')).toBeTruthy();
  });

  it('ya separados, cambiar la ida no pisa la vuelta', async () => {
    const vuelta = jest.fn();
    const vista = await pintar({ ida: 15, vuelta: 45, onCambiarVuelta: vuelta });

    await tocar(vista, 'travel-ida-30');

    expect(vuelta).not.toHaveBeenCalled();
  });

  it('si ya venian distintos, se abre solo', async () => {
    const vista = await pintar({ ida: 15, vuelta: 45 });

    expect(vista.getByTestId('travel-vuelta')).toBeTruthy();
  });
});
