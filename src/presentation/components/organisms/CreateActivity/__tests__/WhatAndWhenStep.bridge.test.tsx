/**
 * La salida del wizard al chat.
 *
 * Quien empieza a llenar el formulario y se da cuenta de que es mas rapido
 * contarlo, tenia que cancelar y volver a entrar por otro lado.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../NameIdentityStep', () => 'NameIdentityStep');
jest.mock('../DaySelectionStep', () => 'DaySelectionStep');

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

    fireEvent.press(vista.getByTestId('tell-assistant-link'));

    expect(irAlChat).toHaveBeenCalled();
  });

  it('editando no aparece: el asistente abriria una segunda actividad en vez de tocar esta', async () => {
    const vista = await render(<WhatAndWhenStep />);

    expect(vista.queryByTestId('tell-assistant-link')).toBeNull();
  });
});
