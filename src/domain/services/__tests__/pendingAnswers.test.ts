/**
 * Lo que el cierre del dia tiene que preguntar.
 *
 * Volver a preguntar lo ya contestado es la forma mas rapida de ensenarle a
 * alguien a ignorar la pregunta.
 */

import { sinResponder } from '../pendingAnswers';

const item = (id: string, titulo: string, fin: string, tipo = 'actividad') =>
  ({
    activity: { id, title: titulo },
    tipo,
    assignedStartTime: '08:00',
    assignedEndTime: fin,
  }) as any;

const AHORA = 20 * 60; // 20:00

const base = {
  minutoActual: AHORA,
  completadas: [] as string[],
  noHechas: [] as string[],
};

describe('las tres situaciones', () => {
  const items = [
    item('a1', 'Calculo', '10:00'),
    item('a2', 'Correr', '12:00'),
    item('a3', 'Leer', '14:00'),
  ];

  it('lo hecho no se pregunta', () => {
    const r = sinResponder({ ...base, items, completadas: ['a1'] });

    expect(r.map((p) => p.id)).not.toContain('a1');
  });

  it('lo que se dijo que NO tampoco', () => {
    // Este era el bug: "no la hice" es una respuesta, no una ausencia.
    const r = sinResponder({ ...base, items, noHechas: ['a2'] });

    expect(r.map((p) => p.id)).not.toContain('a2');
  });

  it('lo que nadie contesto si', () => {
    const r = sinResponder({
      ...base, items, completadas: ['a1'], noHechas: ['a2'],
    });

    expect(r.map((p) => p.id)).toEqual(['a3']);
  });
});

describe('que entra en la lista', () => {
  it('nada que todavia no termino', () => {
    // Preguntar por algo que esta pasando ahora es interrumpirlo.
    const r = sinResponder({
      ...base,
      items: [item('a1', 'Cena', '22:00')],
    });

    expect(r).toHaveLength(0);
  });

  it('un bloque que termina justo ahora ya cuenta', () => {
    const r = sinResponder({
      ...base,
      items: [item('a1', 'Clase', '20:00')],
    });

    expect(r).toHaveLength(1);
  });

  it('los traslados no se preguntan', () => {
    // Un viaje se deriva de una actividad; no es algo que el usuario haga.
    const r = sinResponder({
      ...base,
      items: [item('v1', 'Traslado', '09:00', 'viaje')],
    });

    expect(r).toHaveLength(0);
  });

  it('un hueco sin actividad tampoco', () => {
    const r = sinResponder({
      ...base,
      items: [{ tipo: 'libre', assignedEndTime: '09:00' } as any],
    });

    expect(r).toHaveLength(0);
  });
});

describe('bordes', () => {
  it('un id numerico se compara como texto', () => {
    // Los ids se generan con `Date.now().toString()` pero vuelven del backend
    // como texto; comparar sin normalizar hacia que nunca coincidieran.
    const r = sinResponder({
      ...base,
      items: [item(123 as any, 'Calculo', '10:00')],
      completadas: ['123'],
    });

    expect(r).toHaveLength(0);
  });

  it('una actividad sin titulo no muestra un hueco', () => {
    const r = sinResponder({
      ...base,
      items: [item('a1', '', '10:00')],
    });

    expect(r[0].titulo).toBe('Actividad sin nombre');
  });

  it('un dia vacio no pregunta nada', () => {
    expect(sinResponder({ ...base, items: [] })).toEqual([]);
  });
});
