/**
 * El momento en que el dia queda terminado.
 *
 * Es la contraparte de la casilla: marcar algo tiene que devolver algo.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: { Success: 'success' },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import * as Haptics from 'expo-haptics';
import { Celebration } from '../Celebration';

describe('Celebration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sin nada que festejar no aparece', async () => {
    // El 0 es el estado inicial de la app, no un dia terminado.
    const vista = await render(<Celebration disparo={0} />);

    expect(vista.queryByTestId('celebration')).toBeNull();
  });

  it('al terminar el dia aparece', async () => {
    const vista = await render(<Celebration disparo={1} />);

    expect(vista.getByTestId('celebration')).toBeTruthy();
    expect(vista.getByText('¡Día completo!')).toBeTruthy();
  });

  it('vibra: el golpecito llega antes que cualquier animacion', async () => {
    await render(<Celebration disparo={1} />);

    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it('no bloquea la pantalla', async () => {
    // Es decoracion. Si algo sale mal no puede quedarse tapando la app.
    const vista = await render(<Celebration disparo={1} />);

    expect(vista.getByTestId('celebration').props.pointerEvents).toBe('none');
  });

  it('el mensaje se puede cambiar', async () => {
    const vista = await render(<Celebration disparo={1} mensaje="¡Racha de 7!" />);

    expect(vista.getByText('¡Racha de 7!')).toBeTruthy();
  });

  it('mensaje null = solo confeti, sin el cartel que duplica el texto', async () => {
    // El wizard de creación ya escribe "¡Actividad creada!" debajo del sapo;
    // un cartel encima lo repetiría. Y un cartel sin texto sería una cápsula
    // vacía: decoración muda sobre el confeti.
    const vista = await render(<Celebration disparo={1} mensaje={null} />);

    expect(vista.getByTestId('celebration')).toBeTruthy();
    expect(vista.queryByTestId('cartel')).toBeNull();
    expect(vista.queryByText('¡Día completo!')).toBeNull();
  });

  it('con mensaje muestra la capsula con el texto', async () => {
    const vista = await render(<Celebration disparo={1} mensaje="¡Racha de 3!" />);

    expect(vista.getByTestId('cartel')).toBeTruthy();
    expect(vista.getByText('¡Racha de 3!')).toBeTruthy();
  });
});
