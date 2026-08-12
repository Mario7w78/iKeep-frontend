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
});
