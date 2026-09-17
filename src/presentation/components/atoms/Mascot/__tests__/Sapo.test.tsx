/**
 * La mascota y su ViewModel (API v2 de rive), contra el runtime mockeado.
 *
 * El mock vive en `__mocks__/rive-react-native.tsx` y jest-expo lo aplica solo
 * para todo el runner (moduleNameMapper + mock manual): acá solo se afirma
 * contra él. `__modelos` expone cada ViewModel y `__instancias` las RiveView.
 */

// El store de la racha arrastra Supabase y AsyncStorage, que no tienen
// nativo en jest. Acá no se tocan las APIs.
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

// Los helpers del mock no existen en los tipos reales del paquete: solo
// viven en la instancia que jest resuelve en el runner.
const { __instancias, __modelos, __reset, Fit } = require('rive-react-native') as {
  __instancias: Array<Record<string, any>>;
  __modelos: Array<{
    enumProperty: ReturnType<typeof jest.fn>;
    artboardProperty: ReturnType<typeof jest.fn>;
  }>;
  __reset(): void;
  Fit: { Contain: string };
};

import { Sapo } from '../Sapo';
import { ESTADOS_CON_ANIMACION, estadoRiveDe } from '../sapoStates';

beforeEach(() => {
  __reset();
});

describe('estadoRiveDe', () => {
  it('solo celebrating activa el bucle Success del ViewModel', () => {
    expect(estadoRiveDe('celebrating')).toBe('Success');
    for (const estado of ['idle', 'waving', 'happy', 'thinking', 'sad', 'sleeping'] as const) {
      expect(estadoRiveDe(estado)).toBe('Idle');
    }
    expect(ESTADOS_CON_ANIMACION).toEqual(['celebrating']);
  });
});

describe('contrato del artboard principal', () => {
  it('monta RiveView con el ViewModel en autobind y fit Contain', async () => {
    await render(<Sapo />);

    const rive = __instancias.at(-1)!;
    const modelo = __modelos.at(-1)!;
    expect(rive.file).toBeTruthy();
    expect(rive.dataBind).toBe(modelo);
    expect(rive.fit).toBe(Fit.Contain);
  });

  it('el contenedor escala con size y la RiveView llena ese marco (sin frame fijo)', async () => {
    const vista = await render(<Sapo size={240} testID="sapo-240" />);

    const marco = StyleSheet.flatten(vista.getByTestId('sapo-240').props.style);
    const rive = __instancias.at(-1)!;
    const lienzo = StyleSheet.flatten(rive.style);

    expect(marco).toEqual(expect.objectContaining({ width: 240, height: 240 }));
    expect(lienzo).toEqual({ width: 240, height: 240 });
  });
});

describe('Data Binding', () => {
  it('asigna Idle al enum sapoState al cargar', async () => {
    await render(<Sapo />);

    const modelo = __modelos.at(-1)!;
    const setter = modelo.enumProperty('sapoState') as { set: ReturnType<typeof jest.fn> };
    expect(modelo.enumProperty).toHaveBeenCalledWith('sapoState');
    expect(setter.set).toHaveBeenCalledWith('Idle');
  });

  it('celebrating asigna Success al enum', async () => {
    await render(<Sapo estado="celebrating" />);

    const modelo = __modelos.at(-1)!;
    const setter = modelo.enumProperty('sapoState') as { set: ReturnType<typeof jest.fn> };
    expect(setter.set).toHaveBeenCalledWith('Success');
  });

  it('restablece Idle cuando la app cambia de celebrating a otro estado', async () => {
    const vista = await render(<Sapo estado="celebrating" />);

    const modelo = __modelos.at(-1)!;
    const setter = modelo.enumProperty('sapoState') as { set: ReturnType<typeof jest.fn> };
    setter.set.mockClear();

    await vista.rerender(<Sapo estado="idle" />);

    expect(setter.set).toHaveBeenCalledWith('Idle');
  });
});

describe('cambio de artboard', () => {
  it('hostea Baby -> Kid -> Adult según tipoSapo', async () => {
    const vista = await render(<Sapo tipoSapo={0} />);

    const rive = __instancias.at(-1)!;
    const bindables = rive.file.getBindableArtboard as ReturnType<typeof jest.fn>;
    const modelo = __modelos.at(-1)!;
    const artboardSetter = modelo.artboardProperty('artboardProperty') as { set: ReturnType<typeof jest.fn> };

    expect(bindables).toHaveBeenNthCalledWith(1, 'Baby_Sapo');
    expect(artboardSetter.set).toHaveBeenCalledWith({ nombre: 'Baby_Sapo' });

    await vista.rerender(<Sapo tipoSapo={1} />);
    expect(bindables).toHaveBeenLastCalledWith('Kid_Sapo');
    expect(artboardSetter.set).toHaveBeenLastCalledWith({ nombre: 'Kid_Sapo' });

    await vista.rerender(<Sapo tipoSapo={2} />);
    expect(bindables).toHaveBeenLastCalledWith('Adult_Sapo');
    expect(artboardSetter.set).toHaveBeenLastCalledWith({ nombre: 'Adult_Sapo' });
  });
});