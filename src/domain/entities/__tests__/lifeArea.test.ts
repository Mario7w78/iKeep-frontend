/**
 * Las areas de vida — los petalos del loto.
 *
 * Reemplazan a `identity`, que mezclaba "que es" con "se puede mover".
 */

import {
  AREAS,
  areaDesdeIdentidad,
  comoArea,
  esAreaValida,
} from '../lifeArea';

describe('el conjunto de areas', () => {
  it('son cinco y no mas', () => {
    // Un loto de doce petalos no se lee a 72 px, y cada area nueva diluye a
    // las demas. Si hace falta otra, hay que quitar una.
    expect(AREAS).toHaveLength(5);
  });

  it('cada una explica que cuenta', () => {
    // Sin el ejemplo, "Tu" no significa nada.
    for (const area of AREAS) {
      expect(area.ejemplo.length).toBeGreaterThan(0);
      expect(area.titulo.length).toBeGreaterThan(0);
    }
  });

  it('no hay valores repetidos', () => {
    const valores = AREAS.map((a) => a.valor);

    expect(new Set(valores).size).toBe(valores.length);
  });
});

describe('normalizar lo que llega de afuera', () => {
  it('acepta las cinco', () => {
    for (const area of AREAS) expect(esAreaValida(area.valor)).toBe(true);
  });

  it('un valor desconocido no rompe nada', () => {
    // Es un campo decorativo: no deberia impedirle a alguien abrir su lista.
    expect(comoArea('deportes')).toBe('estudio');
    expect(comoArea(undefined)).toBe('estudio');
    expect(comoArea(null)).toBe('estudio');
    expect(comoArea(7)).toBe('estudio');
  });
});

describe('actividades creadas antes del campo', () => {
  it('un trabajo queda en trabajo', () => {
    expect(areaDesdeIdentidad('trabajo')).toBe('trabajo');
  });

  it('clase y tarea caen las dos en estudio', () => {
    // Es la unica afirmacion que el dato viejo permite: `identity` no sabia
    // distinguir leer por gusto de estudiar para un examen.
    expect(areaDesdeIdentidad('clase')).toBe('estudio');
    expect(areaDesdeIdentidad('tarea')).toBe('estudio');
    expect(areaDesdeIdentidad(undefined)).toBe('estudio');
  });
});
