/**
 * El puente del chat al wizard.
 *
 * Cuando el asistente casi acierta, el usuario tenia que cancelar y rehacer
 * todo a mano. "Ajustar detalles" es la salida.
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

import { MessageBubble } from '../MessageBubble';

const PROPUESTA = {
  id: 'msg-1',
  role: 'assistant' as const,
  timestamp: Date.now(),
  type: 'result' as const,
  content: 'Confirmas?',
  pendingActivity: {
    activityName: 'Calculo',
    parsedState: {
      activityName: 'Calculo',
      identity: 'clase',
      isFixed: true,
      isAnchor: false,
      selectedDays: ['Martes'],
      daysDict: {},
    },
  },
};

describe('MessageBubble: ajustar en el wizard', () => {
  it('la propuesta ofrece ajustar los detalles', async () => {
    const vista = await render(
      <MessageBubble isLatest message={PROPUESTA} onAdjustInWizard={jest.fn()} />
    );

    expect(vista.getByTestId('adjust-in-wizard-button')).toBeTruthy();
  });

  it('al tocarlo avisa de que mensaje se trata', async () => {
    const ajustar = jest.fn();
    const vista = await render(
      <MessageBubble isLatest message={PROPUESTA} onAdjustInWizard={ajustar} />
    );

    fireEvent.press(vista.getByTestId('adjust-in-wizard-button'));

    expect(ajustar).toHaveBeenCalledWith('msg-1');
  });

  it('sin manejador no aparece: no se ofrece una salida que no lleva a ningun lado', async () => {
    const vista = await render(<MessageBubble isLatest message={PROPUESTA} />);

    expect(vista.queryByTestId('adjust-in-wizard-button')).toBeNull();
  });

  it('una propuesta ya confirmada no se puede ajustar', async () => {
    const vista = await render(
      <MessageBubble isLatest
        message={{ ...PROPUESTA, isConfirmed: true }}
        onAdjustInWizard={jest.fn()}
      />
    );

    expect(vista.queryByTestId('adjust-in-wizard-button')).toBeNull();
  });
});
