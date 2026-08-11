/**
 * Las piezas del ciclo de recompensa.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { CompleteToggle } from '../CompleteToggle';
import { DailyProgress } from '../DailyProgress';
import { StreakBadge } from '../StreakBadge';

describe('StreakBadge', () => {
  it('muestra los dias seguidos', async () => {
    const vista = await render(<StreakBadge dias={5} enRiesgo={false} />);

    expect(vista.getByText('5')).toBeTruthy();
  });

  it('en cero no aparece: un contador vacio no motiva', async () => {
    const vista = await render(<StreakBadge dias={0} enRiesgo={false} />);

    expect(vista.queryByTestId('streak-badge')).toBeNull();
  });

  it('avisa del riesgo por accesibilidad, no solo por color', async () => {
    const vista = await render(<StreakBadge dias={3} enRiesgo />);

    expect(vista.getByLabelText('Racha de 3 días, en riesgo')).toBeTruthy();
  });
});

describe('DailyProgress', () => {
  it('dice cuanto va del dia', async () => {
    const vista = await render(
      <DailyProgress completadas={2} total={5} fraccion={0.4} />
    );

    expect(vista.getByText('2 de 5 hoy')).toBeTruthy();
  });

  it('un dia sin nada programado no dibuja barra', async () => {
    // "0 de 0" no significa nada.
    const vista = await render(
      <DailyProgress completadas={0} total={0} fraccion={1} />
    );

    expect(vista.queryByTestId('daily-progress')).toBeNull();
  });
});

describe('CompleteToggle', () => {
  it('avisa al tocarlo', async () => {
    const alternar = jest.fn();
    const vista = await render(
      <CompleteToggle completada={false} onToggle={alternar} />
    );

    await act(async () => {
      fireEvent.press(vista.getByTestId('complete-toggle'));
    });

    expect(alternar).toHaveBeenCalled();
  });

  it('expone su estado como casilla', async () => {
    const vista = await render(
      <CompleteToggle completada nombre="Cálculo" onToggle={jest.fn()} />
    );

    expect(vista.getByLabelText('Desmarcar Cálculo')).toBeTruthy();
  });
});
