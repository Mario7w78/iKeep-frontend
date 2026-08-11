/**
 * Errores pegados al campo que los provoca.
 *
 * Reemplazan a Alert.alert, que tapa la pantalla justo cuando hay que ver qué
 * está mal, desaparece al tocarlo —el mensaje se pierde y hay que reintentar
 * para volver a leerlo— y describe el problema sin señalar dónde está.
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import { useFormErrors, FormErrors } from '../useFormErrors';

// render es asincrono en esta version: sin await, la sonda todavia no
// corrio y caja.actual sigue vacia.
async function capturar(): Promise<{ actual: FormErrors }> {
  const caja = {} as { actual: FormErrors };
  const Sonda = () => {
    caja.actual = useFormErrors();
    return null;
  };
  await render(<Sonda />);
  return caja;
}

describe('useFormErrors', () => {
  it('arranca sin errores', async () => {
    const caja = await capturar();

    expect(caja.actual.hayErrores).toBe(false);
    expect(caja.actual.error('nombre')).toBeUndefined();
  });

  it('guarda un error contra su campo', async () => {
    const caja = await capturar();

    await act(async () => caja.actual.setError('nombre', 'Falta el nombre'));

    expect(caja.actual.error('nombre')).toBe('Falta el nombre');
    expect(caja.actual.hayErrores).toBe(true);
  });

  it('un campo no arrastra al otro', async () => {
    const caja = await capturar();

    await act(async () => {
      caja.actual.setError('nombre', 'Falta el nombre');
      caja.actual.setError('dias', 'Elige al menos un dia');
    });

    expect(caja.actual.error('nombre')).toBe('Falta el nombre');
    expect(caja.actual.error('dias')).toBe('Elige al menos un dia');
  });

  it('el ultimo mensaje reemplaza al anterior del mismo campo', async () => {
    const caja = await capturar();

    await act(async () => caja.actual.setError('horario', 'Primero'));
    await act(async () => caja.actual.setError('horario', 'Segundo'));

    expect(caja.actual.error('horario')).toBe('Segundo');
  });

  it('limpiar uno deja los demas', async () => {
    const caja = await capturar();
    await act(async () => {
      caja.actual.setError('nombre', 'a');
      caja.actual.setError('dias', 'b');
    });

    await act(async () => caja.actual.limpiar('nombre'));

    expect(caja.actual.error('nombre')).toBeUndefined();
    expect(caja.actual.error('dias')).toBe('b');
  });

  it('limpiar uno inexistente no cambia nada', async () => {
    /** Se llama en cada tecla que el usuario escribe: si devolviera un
     *  objeto nuevo cada vez, provocaria un render por pulsacion. */
    const caja = await capturar();
    await act(async () => caja.actual.setError('dias', 'b'));
    const antes = caja.actual.errores;

    await act(async () => caja.actual.limpiar('nombre'));

    expect(caja.actual.errores).toBe(antes);
  });

  it('limpiar todos vacia el formulario', async () => {
    const caja = await capturar();
    await act(async () => {
      caja.actual.setError('nombre', 'a');
      caja.actual.setError('dias', 'b');
    });

    await act(async () => caja.actual.limpiarTodos());

    expect(caja.actual.hayErrores).toBe(false);
  });
});
