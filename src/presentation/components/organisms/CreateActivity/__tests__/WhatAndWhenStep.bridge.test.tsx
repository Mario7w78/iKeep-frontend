/**
 * La salida del wizard al chat.
 *
 * Quien empieza a llenar el formulario y se da cuenta de que es mas rapido
 * contarlo, tenia que cancelar y volver a entrar por otro lado.
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

jest.mock('../NameIdentityStep', () => 'NameIdentityStep');
// El mock necesita un ancla consultable: los selectores de días solo se
// dibujan en el flujo estándar y su ausencia es justo lo que se verifica.
jest.mock('../DaySelectionStep', () => {
  const { createElement } = require('react');
  const { View } = require('react-native');
  return function DiaSeleccionadoMock() {
    return createElement(View, { testID: 'day-selection-step' });
  };
});

import { WhatAndWhenStep } from '../WhatAndWhenStep';

describe('WhatAndWhenStep: salida al asistente', () => {
  it('ofrece contarselo al asistente', async () => {
    const vista = await render(
      <WhatAndWhenStep onContarleAlAsistente={jest.fn()} />
    );

    expect(vista.getByTestId('tell-assistant-link')).toBeTruthy();
  });

  it('al tocarlo avisa', async () => {
    const irAlChat = jest.fn();
    const vista = await render(
      <WhatAndWhenStep onContarleAlAsistente={irAlChat} />
    );

    await act(async () => { fireEvent.press(vista.getByTestId('tell-assistant-link')); });

    expect(irAlChat).toHaveBeenCalled();
  });

  it('editando no aparece: el asistente abriria una segunda actividad en vez de tocar esta', async () => {
    const vista = await render(<WhatAndWhenStep />);

    expect(vista.queryByTestId('tell-assistant-link')).toBeNull();
  });
});

describe('WhatAndWhenStep: modo solo día (fechaUnica)', () => {
  it('con preset muestra la confirmación read-only en vez de los selectores', async () => {
    const vista = await render(
      <WhatAndWhenStep fechaUnica="2026-09-10" />
    );

    expect(vista.getByTestId('solo-este-dia')).toBeTruthy();
    expect(vista.getByText('Solo este día: 2026-09-10')).toBeTruthy();
    // La fecha ya se eligió tocando el día en el mes: no hay selectores.
    expect(vista.queryByTestId('day-selection-step')).toBeNull();
  });

  it('sin preset el flujo estándar queda intacto', async () => {
    const vista = await render(<WhatAndWhenStep />);

    expect(vista.queryByTestId('solo-este-dia')).toBeNull();
    expect(vista.queryByTestId('day-selection-step')).not.toBeNull();
  });

  it('el copy nombra la limitación: solo se ve en el mes', async () => {
    const vista = await render(
      <WhatAndWhenStep fechaUnica="2026-09-10" />
    );

    expect(vista.getByText(/calendario mensual/)).toBeTruthy();
  });
});
