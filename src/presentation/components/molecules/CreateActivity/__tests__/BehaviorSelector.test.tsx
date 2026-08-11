/**
 * La única pregunta de comportamiento.
 *
 * Reemplaza a la tarjeta "Tipo" y al toggle "Anclaje de día" que vivían
 * separados y se contradecían en el texto: la tarjeta describía "Fijo" como
 * "anclado a una hora" mientras el toggle llamado "anclaje" significaba lo
 * contrario.
 */

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// El tema se lee desde el store, que persiste en AsyncStorage.
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BehaviorSelector } from '../BehaviorSelector';

describe('BehaviorSelector', () => {
  it('ofrece las tres opciones', async () => {
    const vista = await render(<BehaviorSelector valor="flexible" onChange={jest.fn()} />);

    expect(vista.getByText('Siempre a la misma hora')).toBeTruthy();
    expect(vista.getByText('Yo elijo el día, tú la hora')).toBeTruthy();
    expect(vista.getByText('Cuando mejor encaje')).toBeTruthy();
  });

  it('muestra un ejemplo bajo cada opcion', async () => {
    /** El titulo solo no desambigua: "yo elijo el dia" y "cuando mejor
     *  encaje" suenan parecido hasta ver los ejemplos al lado. */
    const vista = await render(<BehaviorSelector valor="flexible" onChange={jest.fn()} />);

    expect(vista.getByText(/Cálculo, los martes de 10 a 12/)).toBeTruthy();
    expect(vista.getByText(/gimnasio los lunes/)).toBeTruthy();
  });

  it('marca cual esta elegida', async () => {
    const vista = await render(<BehaviorSelector valor="diaFijo" onChange={jest.fn()} />);

    expect(vista.getByTestId('behavior-diaFijo').props.accessibilityState.selected).toBe(true);
    expect(vista.getByTestId('behavior-horaFija').props.accessibilityState.selected).toBe(false);
  });

  it('avisa cual eligio el usuario', async () => {
    const onChange = jest.fn();
    const vista = await render(<BehaviorSelector valor="flexible" onChange={onChange} />);

    fireEvent.press(vista.getByTestId('behavior-horaFija'));

    expect(onChange).toHaveBeenCalledWith('horaFija');
  });

  it('volver a tocar la elegida no la desmarca', async () => {
    /** Es una eleccion entre tres, no un interruptor: quedarse sin ninguna
     *  dejaria a la actividad sin saber donde ubicarse. */
    const onChange = jest.fn();
    const vista = await render(<BehaviorSelector valor="horaFija" onChange={onChange} />);

    fireEvent.press(vista.getByTestId('behavior-horaFija'));

    expect(onChange).toHaveBeenCalledWith('horaFija');
  });

  it('se anuncia como un grupo de opciones excluyentes', async () => {
    const vista = await render(<BehaviorSelector valor="flexible" onChange={jest.fn()} />);

    expect(vista.getByTestId('behavior-flexible').props.accessibilityRole).toBe('radio');
  });
});
