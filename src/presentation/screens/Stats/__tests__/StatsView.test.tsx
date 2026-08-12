/**
 * La pantalla de progreso.
 *
 * Era un placeholder de 49 lineas que ni siquiera estaba en las pestañas.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
jest.mock('../../../../infrastructure/api/RewardsApiService', () => ({
  fechaLocal: (d: Date = new Date()) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${dd}`;
  },
  obtenerResumen: jest.fn(),
  completarActividad: jest.fn(),
  descompletarActividad: jest.fn(),
}));

import { useRewardsStore } from '../../../../infrastructure/store/useRewardsStore';
import StatsView from '../StatsView';

function ponerEstado(over: any = {}) {
  useRewardsStore.setState({
    racha: { actual: 3, mejor: 9, enRiesgo: false },
    progreso: {
      completadas: 2,
      total: 4,
      fraccion: 0.5,
      terminado: false,
      completadosIds: [],
    },
    diasCompletados: [],
    ...over,
  });
}

describe('StatsView', () => {
  beforeEach(() => ponerEstado());

  it('muestra la racha actual y la mejor', async () => {
    const vista = await render(<StatsView />);

    expect(vista.getByText('3')).toBeTruthy();
    expect(vista.getByText('9')).toBeTruthy();
    expect(vista.getByText('tu mejor racha')).toBeTruthy();
  });

  it('dibuja diez semanas de historial', async () => {
    const vista = await render(<StatsView />);

    const hechos = vista.queryAllByTestId('dia-hecho');
    const vacios = vista.queryAllByTestId('dia-vacio');
    expect(hechos.length + vacios.length).toBe(70);
  });

  it('enciende los dias con algo hecho', async () => {
    const hoy = new Date();
    const clave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    ponerEstado({ diasCompletados: [clave] });

    const vista = await render(<StatsView />);

    expect(vista.queryAllByTestId('dia-hecho')).toHaveLength(1);
  });

  it('sin historial invita a empezar en vez de mostrar ceros secos', async () => {
    const vista = await render(<StatsView />);

    expect(vista.getByText(/empieza a llenarse/)).toBeTruthy();
  });

  it('el singular se respeta', async () => {
    ponerEstado({ racha: { actual: 1, mejor: 1, enRiesgo: false } });

    const vista = await render(<StatsView />);

    expect(vista.getByText('día seguido')).toBeTruthy();
  });
});
