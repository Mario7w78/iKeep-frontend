jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import React from 'react';
import { render } from '@testing-library/react-native';

import { FieldError } from '../FieldError';

describe('FieldError', () => {
  it('muestra el mensaje', async () => {
    const vista = await render(<FieldError mensaje="Falta el nombre" />);

    expect(vista.getByText('Falta el nombre')).toBeTruthy();
  });

  it('sin mensaje no dibuja nada', async () => {
    /** Se deja puesto de forma permanente en el JSX, asi que sin error no
     *  puede ocupar lugar ni empujar el resto de la pantalla. */
    const vista = await render(<FieldError />);

    expect(vista.queryByTestId('field-error')).toBeNull();
  });

  it('se anuncia como alerta para lectores de pantalla', async () => {
    const vista = await render(<FieldError mensaje="Elige un dia" />);

    expect(vista.getByTestId('field-error').props.accessibilityRole).toBe('alert');
  });
});
