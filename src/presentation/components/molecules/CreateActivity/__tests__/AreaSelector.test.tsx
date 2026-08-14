/**
 * El selector de area de vida.
 *
 * Reemplaza a las tres tarjetas de identidad, que ademas de preguntar mal
 * tenian efectos secundarios ocultos: elegir "Clase" ponia la actividad en
 * fija y le reescribia la prioridad y la dificultad al usuario sin avisar.
 * Este solo cambia el area.
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

import { AreaSelector } from '../AreaSelector';
import { AREAS } from '../../../../../domain/entities/lifeArea';

describe('AreaSelector', () => {
  it('ofrece las cinco areas', async () => {
    const vista = await render(<AreaSelector valor="estudio" onChange={jest.fn()} />);

    for (const area of AREAS) {
      expect(vista.getByTestId(`area-${area.valor}`)).toBeTruthy();
    }
  });

  it('elegir un area avisa una sola vez y con el valor', async () => {
    const onChange = jest.fn();
    const vista = await render(<AreaSelector valor="estudio" onChange={onChange} />);

    // Envuelto en act: un press suelto no rompe este test, rompe el
    // SIGUIENTE, y encontrar eso cuesta una tarde.
    await act(async () => {
      fireEvent.press(vista.getByTestId('area-cuerpo'));
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('cuerpo');
  });

  it('muestra que cuenta en el area elegida', async () => {
    // Sin el ejemplo, "Tu" no significa nada.
    const vista = await render(<AreaSelector valor="yo" onChange={jest.fn()} />);

    expect(vista.getByTestId('area-ejemplo').props.children).toBe('Leer, música, no hacer nada');
  });

  it('marca como seleccionada la que esta activa, para lectores de pantalla', async () => {
    const vista = await render(<AreaSelector valor="vinculos" onChange={jest.fn()} />);

    expect(vista.getByTestId('area-vinculos').props.accessibilityState.selected).toBe(true);
    expect(vista.getByTestId('area-estudio').props.accessibilityState.selected).toBe(false);
  });
});
