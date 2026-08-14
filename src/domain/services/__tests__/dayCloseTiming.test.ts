/**
 * Cuando ofrecer el cierre del dia.
 *
 * Equivocarse en una sola de las condiciones vuelve la app molesta, y una app
 * molesta se desinstala antes de que llegue a servir para algo.
 */

import { correspondeOfrecerCierre } from '../dayCloseTiming';

const BASE = { hora: 22, sinResolver: 2, yaCerro: false };

describe('cuando si', () => {
  it('de noche, con cosas sin responder y sin haber cerrado', () => {
    expect(correspondeOfrecerCierre(BASE)).toBe(true);
  });
});

describe('cuando no', () => {
  it('a media tarde: el dia todavia esta pasando', () => {
    expect(correspondeOfrecerCierre({ ...BASE, hora: 15 })).toBe(false);
  });

  it('si no quedo nada sin responder', () => {
    // Preguntar cuando no hay nada que preguntar convierte el cierre en un
    // peaje diario.
    expect(correspondeOfrecerCierre({ ...BASE, sinResolver: 0 })).toBe(false);
  });

  it('si el usuario ya contesto', () => {
    // Volver a preguntar lo ya contestado es la forma mas rapida de ensenarle
    // a ignorar la pregunta.
    expect(correspondeOfrecerCierre({ ...BASE, yaCerro: true })).toBe(false);
  });

  it('haber cerrado gana sobre todo lo demas', () => {
    expect(
      correspondeOfrecerCierre({ hora: 23, sinResolver: 9, yaCerro: true })
    ).toBe(false);
  });
});

describe('el borde de la hora', () => {
  it('a las 20 en punto ya corresponde', () => {
    expect(correspondeOfrecerCierre({ ...BASE, hora: 20 })).toBe(true);
  });

  it('a las 19:59 todavia no', () => {
    expect(correspondeOfrecerCierre({ ...BASE, hora: 19 })).toBe(false);
  });
});
