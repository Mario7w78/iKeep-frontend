/**
 * La seccion CALENDARIO DE GOOGLE vive entre ENERGIA y CUENTA.
 *
 * El orden de Configuracion es contrato visual: el usuario ya sabe donde
 * esta cada cosa, y el lugar del vinculo con Google es justo antes de la
 * cuenta, no mezclado con preferencias.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => {
    const { View } = require('react-native');
    const { children, style, ...rest } = props;
    return <View style={style} {...rest}>{children}</View>;
  },
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View /> };
});
jest.mock('../../../../infrastructure/persistence/EnergyHistoryService', () => ({
  saveEnergyPatternOverride: jest.fn(), getEnergyPatternOverride: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../../../di/Dependencies', () => ({
  useScheduleStore: () => ({
    startHour: 480, endHour: 1320,
    setStartHour: jest.fn(), setEndHour: jest.fn(),
    handleGenerateSchedule: jest.fn(), customEnergyPattern: null, setCustomEnergyPattern: jest.fn(),
  }),
}));
jest.mock('../../../../infrastructure/store/useAuthStore', () => ({
  useAuthStore: () => ({ signOut: jest.fn() }),
}));

// Lo de google se simula en el borde HTTP; la seccion queda real.
const mockGoogleEstado = jest.fn();
jest.mock('../../../../infrastructure/api/GoogleCalendarApiService', () => ({
  iniciarConexion: jest.fn(),
  consultarEstado: (...a: any[]) => mockGoogleEstado(...a),
  cargarEventos: jest.fn(),
  desconectar: jest.fn(),
}));

import SettingsView from '../SettingsView';
import { useGoogleCalendarStore } from '../../../../infrastructure/store/useGoogleCalendarStore';

/** Recorre el arbol y devuelve los textos en el ORDEN en que se pintan. */
function textosEnOrden(raiz: any): string[] {
  const salida: string[] = [];
  const visitar = (nodo: any) => {
    if (nodo == null) return;
    if (Array.isArray(nodo)) return nodo.forEach(visitar);
    if (typeof nodo === 'string') { salida.push(nodo); return; }
    if (typeof nodo === 'object') {
      if (nodo.children !== undefined) visitar(nodo.children);
    }
  };
  visitar(raiz.toJSON?.() ?? raiz);
  return salida.filter((t) => t.trim().length > 0);
}

describe('SettingsView', () => {
  beforeEach(() => {
    mockGoogleEstado.mockReset().mockResolvedValue(false);
    useGoogleCalendarStore.setState({
      estado: 'desconectado', porDia: {}, cargando: false, error: null, verificado: false,
    });
  });

  it('muestra CALENDARIO DE GOOGLE entre ENERGÍA y CUENTA', async () => {
    const vista = await render(<SettingsView />);

    const textos = textosEnOrden(vista.toJSON());
    const energia = textos.indexOf('ENERGÍA');
    const google = textos.indexOf('CALENDARIO DE GOOGLE');
    const cuenta = textos.indexOf('CUENTA');

    expect(energia).toBeGreaterThan(-1);
    expect(google).toBeGreaterThan(energia);
    expect(cuenta).toBeGreaterThan(google);

    // Y la seccion de google esta viva dentro.
    expect(vista.getByTestId('google-section')).toBeTruthy();
  });
});
