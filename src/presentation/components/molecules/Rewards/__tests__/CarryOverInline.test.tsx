/**
 * La reprogramación integrada.
 *
 * Es el carry-over como tarjeta de notificación, no como popup: las tres
 * preguntas («la hice», «no la hice», «reprogramar») viven en la misma UI y
 * nada se toca hasta que el usuario elige. Reproducir es la regla de oro.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

import { CarryOverInline } from '../CarryOverInline';

const pendientes = [
  {
    fecha: '2026-09-10',
    items: [{ activityId: 'act-1', titulo: 'Plan Estratégico' }],
  },
];

const mocks = {
  onMarcar: jest.fn().mockResolvedValue(undefined),
  onReprogramar: jest.fn().mockResolvedValue(undefined),
};

describe('CarryOverInline', () => {
  beforeEach(() => {
    mocks.onMarcar.mockClear();
    mocks.onReprogramar.mockClear();
  });

  it('sin pendientes no se muestra', async () => {
    const vista = await render(<CarryOverInline pendientes={[]} {...mocks} />);

    expect(vista.queryByTestId('leccion-reprogramada')).toBeNull();
  });

  it('ofrece las tres respuestas para cada pendiente', async () => {
    const vista = await render(<CarryOverInline pendientes={pendientes} {...mocks} />);

    expect(vista.getByText(/¿Tuviste un problema el .*10 de septiembre\?/)).toBeTruthy();
    expect(vista.getByText('Plan Estratégico')).toBeTruthy();
    expect(vista.getByText('La hice')).toBeTruthy();
    expect(vista.getByText('No la hice')).toBeTruthy();
    expect(vista.getByText('Reprogramar')).toBeTruthy();
  });

  it('«La hice» marca como hecha', async () => {
    const vista = await render(<CarryOverInline pendientes={pendientes} {...mocks} />);

    await fireEvent.press(vista.getByTestId('leccion-act-1-hecha'));

    expect(mocks.onMarcar).toHaveBeenCalledWith('act-1', '2026-09-10', true);
  });

  it('«No la hice» marca como no hecha', async () => {
    const vista = await render(<CarryOverInline pendientes={pendientes} {...mocks} />);

    await fireEvent.press(vista.getByTestId('leccion-act-1-no_hecha'));

    expect(mocks.onMarcar).toHaveBeenCalledWith('act-1', '2026-09-10', false);
  });

  it('reprogramar despliega destinos y mueve la actividad', async () => {
    const vista = await render(<CarryOverInline pendientes={pendientes} {...mocks} />);

    await fireEvent.press(vista.getByTestId('leccion-act-1-reprogramar'));

    const destinos = await vista.findAllByTestId(/^leccion-destino-\d/);
    expect(destinos.length).toBeGreaterThanOrEqual(7);
    expect(vista.getByTestId('leccion-destino-volver')).toBeTruthy();

    await fireEvent.press(destinos[0]);

    expect(mocks.onReprogramar).toHaveBeenCalledWith('act-1', '2026-09-10', expect.any(String));
  });

  it('se puede ocultar por ahora; no resuelve nada', async () => {
    const vista = await render(<CarryOverInline pendientes={pendientes} {...mocks} />);

    await fireEvent.press(vista.getByTestId('leccion-ocultar'));

    expect(vista.queryByTestId('leccion-reprogramada')).toBeNull();
    expect(mocks.onMarcar).not.toHaveBeenCalled();
    expect(mocks.onReprogramar).not.toHaveBeenCalled();
  });
});