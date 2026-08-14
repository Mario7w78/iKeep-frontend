/**
 * El cierre del dia.
 *
 * Abrir a las once de la noche con el dia entero sin marcar es el caso MAS
 * frecuente, no el raro. Y es donde se decide si la app se siente como un
 * companero o como un formulario.
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

import { DayClose } from '../DayClose';

const PENDIENTES = [
  { id: 'a1', titulo: 'Calculo' },
  { id: 'a2', titulo: 'Correr' },
];

function montar(props: Partial<React.ComponentProps<typeof DayClose>> = {}) {
  return render(
    <DayClose
      visible
      pendientes={PENDIENTES}
      onResponder={jest.fn()}
      onCerrar={jest.fn()}
      {...props}
    />
  );
}

const tocar = async (vista: any, id: string) => {
  await act(async () => {
    fireEvent.press(vista.getByTestId(id));
  });
};

describe('las tres salidas', () => {
  it('son tres y no cuatro casillas', async () => {
    // Tildar una por una es trabajo administrativo. La respuesta correcta es
    // una pregunta con tres salidas.
    const vista = await montar();

    expect(vista.getByTestId('cierre-todo')).toBeTruthy();
    expect(vista.getByTestId('cierre-algunas')).toBeTruthy();
    expect(vista.getByTestId('cierre-dificil')).toBeTruthy();
  });

  it('"hice todo" resuelve el dia de un toque', async () => {
    // Es el camino mas corto porque es el caso mas comun de quien abre la app.
    const onResponder = jest.fn();
    const vista = await montar({ onResponder });

    await tocar(vista, 'cierre-todo');

    expect(onResponder).toHaveBeenCalledWith('todo', []);
  });

  it('"fue un dia dificil" no pregunta nada mas', async () => {
    // Cero completadas, cero preguntas, cero penalizacion.
    const onResponder = jest.fn();
    const vista = await montar({ onResponder });

    await tocar(vista, 'cierre-dificil');

    expect(onResponder).toHaveBeenCalledWith('dificil', []);
  });

  it('la lista solo aparece si dice que hizo algunas', async () => {
    const vista = await montar();

    expect(vista.queryByTestId('cierre-item-a1')).toBeNull();

    await tocar(vista, 'cierre-algunas');

    expect(vista.getByTestId('cierre-item-a1')).toBeTruthy();
  });
});

describe('elegir cuales', () => {
  it('manda solo las tocadas', async () => {
    const onResponder = jest.fn();
    const vista = await montar({ onResponder });

    await tocar(vista, 'cierre-algunas');
    await tocar(vista, 'cierre-item-a1');
    await tocar(vista, 'cierre-confirmar');

    expect(onResponder).toHaveBeenCalledWith('algunas', ['a1']);
  });

  it('tocar dos veces la quita', async () => {
    const onResponder = jest.fn();
    const vista = await montar({ onResponder });

    await tocar(vista, 'cierre-algunas');
    await tocar(vista, 'cierre-item-a1');
    await tocar(vista, 'cierre-item-a1');
    await tocar(vista, 'cierre-confirmar');

    expect(onResponder).toHaveBeenCalledWith('algunas', []);
  });
});

describe('lo que dice y lo que no', () => {
  it('promete en voz alta que ninguna rompe la racha', async () => {
    // Si el usuario cree que responder con honestidad le cuesta la racha, no
    // responde: cierra la app. Decirlo es parte del diseno, no decoracion.
    const vista = await montar();

    expect(vista.getByText('Ninguna de las tres rompe tu racha.')).toBeTruthy();
  });

  it('no reprocha en ninguna de las salidas', async () => {
    const vista = await montar();
    const textos = ['Hice todo', 'Hice algunas', 'Fue un día difícil'];

    for (const t of textos) {
      expect(vista.getByText(t)).toBeTruthy();
      expect(t).not.toMatch(/fallaste|no lograste|incumpl/i);
    }
  });

  it('cuenta cuantas quedan, en singular y en plural', async () => {
    const dos = await montar();
    expect(dos.getByText('Quedan 2 actividades sin responder.')).toBeTruthy();

    const una = await montar({ pendientes: [PENDIENTES[0]] });
    expect(una.getByText('Queda 1 actividad sin responder.')).toBeTruthy();
  });
});
