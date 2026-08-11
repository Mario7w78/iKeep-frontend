/**
 * El resumen plegado al pie de los horarios.
 *
 * Como pantalla propia cobraba un toque de "Siguiente" para llegar y otro de
 * "Atras" para corregir: el precio se pagaba siempre, el beneficio solo
 * cuando alguien lo leia.
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

import SummaryStep from '../SummaryStep';

const RESUMEN: any = {
  activityName: 'Calculo',
  isFixed: true,
  isAnchor: false,
  identity: 'clase',
  priority: 'media',
  difficulty: 'media',
  deadline: null,
  configuredDays: ['Martes'],
  totalMinutes: 120,
  groups: {},
  editingGroupId: null,
  onEditGroup: jest.fn(),
  onDiscardGroup: jest.fn(),
};

describe('SummaryStep embebido', () => {
  it('arranca plegado: abierto empujaria el boton de crear fuera de pantalla', async () => {
    const vista = await render(<SummaryStep {...RESUMEN} embebido />);

    expect(vista.getByTestId('summary-toggle')).toBeTruthy();
    expect(vista.queryByTestId('summary-body')).toBeNull();
  });

  it('al tocarlo muestra lo que se va a crear', async () => {
    const vista = await render(<SummaryStep {...RESUMEN} embebido />);

    await act(async () => { fireEvent.press(vista.getByTestId('summary-toggle')); });

    expect(vista.getByTestId('summary-body')).toBeTruthy();
    expect(vista.getByText('Calculo')).toBeTruthy();
  });

  it('vuelve a plegarse', async () => {
    const vista = await render(<SummaryStep {...RESUMEN} embebido />);

    await act(async () => { fireEvent.press(vista.getByTestId('summary-toggle')); });
    await act(async () => { fireEvent.press(vista.getByTestId('summary-toggle')); });

    expect(vista.queryByTestId('summary-body')).toBeNull();
  });

  it('como paso propio sigue mostrandose entero y sin plegar', async () => {
    /** El modo viejo no se rompio: solo dejo de usarse en el wizard. */
    const vista = await render(<SummaryStep {...RESUMEN} />);

    expect(vista.getByText('Resumen')).toBeTruthy();
    expect(vista.getByText('Calculo')).toBeTruthy();
    expect(vista.queryByTestId('summary-toggle')).toBeNull();
  });
});
