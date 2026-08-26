/**
 * La mascota y su State Machine, contra el runtime Rive mockeado.
 *
 * El mock vive en `__mocks__/rive-react-native.tsx` y jest-expo lo aplica
 * solo para todo el runner: acá solo se afirma contra él.
 */

// El store de la racha arrastra Supabase y AsyncStorage, que no tienen
// nativo en jest. Acá la racha se fija con setState: las APIs no se tocan.
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// El asset se resuelve bien en el runner (stub por moduleNameMapper); la
// prueba de "falta el asset" baja esta bandera en vez de reimportar todo.
// `undefined` = usar el real; se resuelve perezoso para esquivar el TDZ
// del factory izado de jest.mock.
const mockFuenteVisible: { valor: number | null | undefined } = { valor: undefined };
jest.mock('../sapoAssets', () => ({
  get FUENTE_SAPO() {
    if (mockFuenteVisible.valor === undefined) {
      mockFuenteVisible.valor = jest.requireActual('../sapoAssets').FUENTE_SAPO;
    }
    return mockFuenteVisible.valor;
  },
}));

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

// Los helpers del mock no existen en los tipos reales del paquete: solo
// viven en la instancia que jest resuelve en el runner.
const { __instancias, __reset } = require('rive-react-native') as {
  __instancias: Array<{
    props: Record<string, any>;
    play: ReturnType<typeof jest.fn>;
    pause: ReturnType<typeof jest.fn>;
    stop: ReturnType<typeof jest.fn>;
    reset: ReturnType<typeof jest.fn>;
    setEnum: ReturnType<typeof jest.fn>;
  }>;
  __reset(): void;
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
  it('monta Artboard y su State Machine, con Data Binding activo', async () => {
    await render(<Sapo />);

    const rive = __instancias.at(-1);
    expect(rive?.props.artboardName).toBe('Artboard');
    expect(rive?.props.stateMachineName).toBe('State Machine');
    expect(rive?.props.dataBinding).toEqual({ type: 'autobind', value: true });
  });
});

describe('Data Binding', () => {
  it('asigna Idle al enum sapoState al cargar', async () => {
    await render(<Sapo />);

    const rive = __instancias.at(-1);
    expect(rive?.setEnum).toHaveBeenCalledWith('sapoState', 'Idle');
  });

  it('celebrating asigna Success y no reproduce animaciones lineales', async () => {
    await render(<Sapo estado="celebrating" />);

    const rive = __instancias.at(-1)!;
    expect(rive.setEnum).toHaveBeenCalledWith('sapoState', 'Success');
    expect(rive.play).not.toHaveBeenCalled();
  });

  it('restablece Idle cuando la app cambia de celebrating a otro estado', async () => {
    const vista = await render(<Sapo estado="celebrating" />);
    const rive = __instancias.at(-1)!;
    rive.setEnum.mockClear();

    await vista.rerender(<Sapo estado="idle" />);

    expect(rive.setEnum).toHaveBeenCalledWith('sapoState', 'Idle');
  });
});

describe('Sapo sin animar', () => {
  it('no llama al runtime cuando se le pide quieto', async () => {
    await render(<Sapo animar={false} />);
    await render(<Sapo estado="happy" animar={false} />);

    for (const instancia of __instancias) {
      expect(instancia.setEnum).not.toHaveBeenCalled();
    }
  });
});

describe('Sapo sin asset', () => {
  it('un require que falla deja el hueco reservado, sin romper nada', async () => {
    /** La mascota es decoración: si falta el asset, la pantalla conserva
     *  su composición en vez de romperse o reacomodarse. */
    const montadas = __instancias.length;
    mockFuenteVisible.valor = null;
    try {
      const vista = await render(<Sapo tamano={80} />);

      const estilo = StyleSheet.flatten(vista.getByTestId('sapo').props.style);
      expect(estilo).toEqual(expect.objectContaining({ width: 80, height: 80 }));
    } finally {
      mockFuenteVisible.valor = require('../sapoAssets').FUENTE_SAPO;
    }
    // No quedó ninguna instancia de Rive montada por este render.
    expect(__instancias).toHaveLength(montadas);
  });
});
