/**
 * Tarjetas de eliminar y regenerar.
 *
 * No construyen una actividad, así que no traen `parsedState`: la tarjeta de
 * detalles no aplica y accederle rompía la pantalla. Estos tests fijan que
 * cada tipo de propuesta se dibuje con lo suyo.
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

import { MessageBubble } from '../MessageBubble';

const base = {
  id: 'msg-1',
  role: 'assistant' as const,
  timestamp: Date.now(),
  type: 'result' as const,
};

function mensajeDe(pendingActivity: any, content = 'Confirmas?') {
  return { ...base, content, pendingActivity };
}

describe('MessageBubble con acciones simples', () => {
  it('una eliminacion muestra el nombre de lo que se va a borrar', async () => {
    const vista = await render(
      <MessageBubble isLatest
        message={mensajeDe({ kind: 'eliminar', id: 'act-7', originalName: 'Gimnasio' })}
      />
    );

    expect(vista.getByText('Eliminar actividad')).toBeTruthy();
    expect(vista.getByText('Gimnasio')).toBeTruthy();
  });

  it('el boton de eliminar dice eliminar, no confirmar', async () => {
    /** Un boton que dice "Confirmar" no advierte de que lo que sigue es
     *  irreversible. */
    const vista = await render(
      <MessageBubble isLatest
        message={mensajeDe({ kind: 'eliminar', id: 'act-7', originalName: 'Gimnasio' })}
      />
    );

    expect(vista.getByText('Eliminar')).toBeTruthy();
    expect(vista.queryByText('Confirmar')).toBeNull();
  });

  it('una regeneracion explica que va a pasar', async () => {
    const vista = await render(
      <MessageBubble isLatest message={mensajeDe({ kind: 'regenerar', id: 'regen-1' })} />
    );

    expect(vista.getByText('Reorganizar horario')).toBeTruthy();
    expect(vista.getByText('Reorganizar')).toBeTruthy();
  });

  it('las acciones simples no rompen aunque no traigan parsedState', async () => {
    /** El caso que motivo estos tests: la tarjeta de detalles accedia a
     *  parsedState.activityName sin comprobarlo. */
    const vista = await render(
      <MessageBubble isLatest message={mensajeDe({ kind: 'eliminar', id: 'act-7' })} />
    );

    expect(vista.getByText('Eliminar actividad')).toBeTruthy();
  });

  it('una vez confirmada deja de ofrecer los botones', async () => {
    const vista = await render(
      <MessageBubble isLatest
        message={{
          ...mensajeDe({ kind: 'eliminar', id: 'act-7', originalName: 'Gimnasio' }),
          isConfirmed: true,
        }}
      />
    );

    expect(vista.queryByText('Eliminar')).toBeNull();
    expect(vista.getByText('✓ Confirmado')).toBeTruthy();
  });

  it('una propuesta de crear sigue mostrando la tarjeta de detalles', async () => {
    /** La rama vieja no se toco. */
    const vista = await render(
      <MessageBubble isLatest
        message={mensajeDe({
          kind: 'crear',
          id: '1',
          isModification: false,
          parsedState: {
            activityName: 'Calculo',
            identity: 'clase',
            isFixed: false,
            isAnchor: false,
            priority: 'media',
            difficulty: 'media',
            selectedDays: [],
            daysDict: {},
            duracionMinutos: 60,
            horaPreferidaInicio: null,
            horaPreferidaFin: null,
          },
        })}
      />
    );

    expect(vista.getByText('Nueva Actividad')).toBeTruthy();
    expect(vista.getByText('Calculo')).toBeTruthy();
    expect(vista.getByText('Confirmar')).toBeTruthy();
  });
});
