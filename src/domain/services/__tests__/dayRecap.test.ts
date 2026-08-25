import { areaDestacada, ItemConArea } from '../dayRecap';

const item = (id: string, area?: ItemConArea['area']): ItemConArea => ({
  id,
  ...(area ? { area } : {}),
});

describe('areaDestacada', () => {
  it('nombra la unica area que va adelante', () => {
    // Tres de Salud contra una de estudio: decir "Salud" es afirmar un hecho.
    const items = [
      item('a', 'cuerpo'),
      item('b', 'cuerpo'),
      item('c', 'cuerpo'),
      item('d', 'estudio'),
    ];

    expect(areaDestacada(items, ['a', 'b', 'c'])).toBe('cuerpo');
  });

  it('se calla si hay empate en el primer puesto', () => {
    // Nombrar a uno de los dos ganadores inventa un hecho; nombrar a los dos
    // diluye el mensaje. Ninguno es la única respuesta honesta.
    const items = [
      item('a', 'cuerpo'),
      item('b', 'estudio'),
      item('c', 'cuerpo'),
      item('d', 'estudio'),
    ];

    expect(areaDestacada(items, ['a', 'b', 'c', 'd'])).toBeNull();
  });

  it('gana el que supera al empate, aunque llegue ultimo', () => {
    const items = [
      item('a', 'cuerpo'),
      item('b', 'estudio'),
      item('c', 'vinculos'),
      item('d', 'cuerpo'),
      item('e', 'estudio'),
      item('f', 'vinculos'),
      item('g', 'vinculos'),
    ];

    expect(areaDestacada(items, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toBe(
      'vinculos'
    );
  });

  it('no afirma nada si no se hizo nada', () => {
    const items = [item('a', 'cuerpo'), item('b', 'estudio')];

    expect(areaDestacada(items, [])).toBeNull();
  });

  it('ignora lo hecho sin area declarada', () => {
    // Sin área no hay nada que atribuir: contar la actividad igual sería
    // inventar el dato que falta.
    const items = [
      item('a', 'cuerpo'),
      item('sin-area'),
      item('tambien-sin-area'),
    ];

    expect(areaDestacada(items, ['a', 'sin-area', 'tambien-sin-area'])).toBe(
      'cuerpo'
    );
    expect(
      areaDestacada([item('sin-area')], ['sin-area'])
    ).toBeNull();
  });

  it('solo cuenta las hechas: las pendientes no suman para su area', () => {
    // Dos de cuerpo SIN hacer contra una de estudio hecha: lo que se destaca
    // es lo que se movió, no lo que estaba programado.
    const items = [
      item('a', 'cuerpo'),
      item('b', 'cuerpo'),
      item('c', 'estudio'),
    ];

    expect(areaDestacada(items, ['c'])).toBe('estudio');
  });
});
