/**
 * El aviso de Google Calendar.
 *
 * El store es el real (zustand): se prueba la pantalla, no un mock que ya
 * devuelve lo que quiero oir. El CTA se muestra al desconectado, se esconde
 * solo tras unos segundos, recuerda ese escondido en AsyncStorage, y deja de
 * ser molesto cuando se reconecta (y borra el recuerdo para volver a
 * ofrecerse tras una desconexión futura).
 */

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

import React from 'react';
import { act, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { GoogleCalendarCta } from '../GoogleCalendarCta';
import { useGoogleCalendarStore } from '../../../../../infrastructure/store/useGoogleCalendarStore';

const CLAVE = '@google_cta_visto';

function resetStore(overrides: Record<string, unknown> = {}) {
  useGoogleCalendarStore.setState({
    estado: 'desconectado',
    porDia: {},
    cargando: false,
    error: null,
    ultimoConteo: null,
    verificado: true,
    ...overrides,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  resetStore();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockClear();
  (AsyncStorage.removeItem as jest.Mock).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('GoogleCalendarCta', () => {
  it('se muestra al desconectado, con español neutro', async () => {
    const vista = await render(<GoogleCalendarCta />);

    expect(vista.getByTestId('google-cta')).toBeTruthy();
    expect(vista.getByText('Sincroniza tu Google Calendar')).toBeTruthy();
    expect(vista.queryByText('Sincronizá tu Google Calendar')).toBeNull();
  });

  it('se esconde solo tras unos segundos y deja registro en AsyncStorage', async () => {
    const vista = await render(<GoogleCalendarCta />);
    expect(vista.getByTestId('google-cta')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(8000);
    });

    expect(vista.queryByTestId('google-cta')).toBeNull();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CLAVE, expect.any(String));
  });

  it('no vuelve a mostrarse en la próxima visita si fue visto hace poco', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(String(Date.now()));

    const vista = await render(<GoogleCalendarCta />);

    expect(vista.queryByTestId('google-cta')).toBeNull();
  });

  it('no se muestra cuando ya está conectado', async () => {
    resetStore({ estado: 'conectado' });

    const vista = await render(<GoogleCalendarCta />);

    expect(vista.queryByTestId('google-cta')).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(CLAVE);
  });
});