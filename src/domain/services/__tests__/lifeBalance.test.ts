/**
 * La flor de loto.
 *
 * Arregla un problema real de las rachas: se pueden llevar treinta dias
 * seguidos estudiando y haber dejado de dormir, de moverte y de ver gente, y
 * la app te felicita igual.
 */

import { construirFlor } from '../lifeBalance';

const NADA = { estudio: 0, trabajo: 0, cuerpo: 0, vinculos: 0, yo: 0 };

describe('el tamano del petalo', () => {
  it('hay uno por cada area, siempre', () => {
    // Omitir las vacias dejaria la flor sin decir lo unico importante: que
    // hay un area en blanco.
    expect(construirFlor(NADA, NADA).petalos).toHaveLength(5);
  });

  it('sin nada hecho, todos en cero', () => {
    for (const p of construirFlor(NADA, NADA).petalos) {
      expect(p.tamano).toBe(0);
    }
  });

  it('los primeros dias se notan mas que los ultimos', () => {
    // Rendimientos decrecientes: si el crecimiento fuera lineal, empezar no
    // se veria y nadie llega al dia veinte.
    const flor = (n: number) =>
      construirFlor({ ...NADA, estudio: n }, NADA).petalos[0].tamano;

    expect(flor(3) - flor(0)).toBeGreaterThan(flor(33) - flor(30));
  });

  it('nunca pasa de lleno', () => {
    const p = construirFlor({ ...NADA, estudio: 5000 }, NADA).petalos[0];

    expect(p.tamano).toBeLessThanOrEqual(1);
  });

  it('no encoge aunque lo reciente este vacio', () => {
    // Ver un petalo achicarse porque dejaste de correr es exactamente el
    // reproche que este diseno evita.
    const flor = construirFlor({ ...NADA, cuerpo: 30 }, NADA);
    const cuerpo = flor.petalos.find((p) => p.area === 'cuerpo')!;

    expect(cuerpo.tamano).toBeGreaterThan(0);
  });
});

describe('lo que abre la flor', () => {
  it('no es el volumen', () => {
    // Una flor con un solo petalo gigante no es una flor.
    const soloEstudio = construirFlor(NADA, { ...NADA, estudio: 100 });

    expect(soloEstudio.apertura).toBe(0);
  });

  it('es el equilibrio', () => {
    const repartido = construirFlor(NADA, {
      estudio: 6, trabajo: 6, cuerpo: 6, vinculos: 6, yo: 6,
    });

    expect(repartido.apertura).toBeCloseTo(1, 5);
  });

  it('dos areas abren mas que una, y menos que cinco', () => {
    const una = construirFlor(NADA, { ...NADA, estudio: 20 }).apertura;
    const dos = construirFlor(NADA, { ...NADA, estudio: 10, cuerpo: 10 }).apertura;
    const cinco = construirFlor(NADA, {
      estudio: 4, trabajo: 4, cuerpo: 4, vinculos: 4, yo: 4,
    }).apertura;

    expect(una).toBeLessThan(dos);
    expect(dos).toBeLessThan(cinco);
  });

  it('sin nada hecho no esta rota, esta cerrada', () => {
    // Una flor a medio abrir no esta rota: esta abriendose.
    expect(construirFlor(NADA, NADA).apertura).toBe(0);
  });
});

describe('el area mas olvidada', () => {
  it('no se nombra si todo esta parejo', () => {
    // Senalar una "mas olvidada" cuando no hay desnivel es inventar un
    // problema.
    const flor = construirFlor(NADA, {
      estudio: 4, trabajo: 4, cuerpo: 4, vinculos: 4, yo: 4,
    });

    expect(flor.masOlvidada).toBeNull();
  });

  it('no se nombra con poca actividad', () => {
    // Con tres datos, cualquier comparacion es ruido.
    const flor = construirFlor(NADA, { ...NADA, estudio: 3 });

    expect(flor.masOlvidada).toBeNull();
  });

  it('con desnivel claro si', () => {
    const flor = construirFlor(NADA, {
      estudio: 20, trabajo: 8, cuerpo: 6, vinculos: 0, yo: 5,
    });

    expect(flor.masOlvidada).toBe('vinculos');
  });

  it('exige que la diferencia llegue al doble', () => {
    const flor = construirFlor(NADA, {
      estudio: 10, trabajo: 9, cuerpo: 8, vinculos: 7, yo: 6,
    });

    expect(flor.masOlvidada).toBeNull();
  });
});

describe('bordes', () => {
  it('un area desconocida no rompe la flor', () => {
    const flor = construirFlor({ deportes: 9 } as any, { deportes: 9 } as any);

    expect(flor.petalos).toHaveLength(5);
    expect(flor.apertura).toBe(0);
  });

  it('un conteo negativo se trata como cero', () => {
    const flor = construirFlor({ ...NADA, estudio: -5 }, NADA);

    expect(flor.petalos[0].tamano).toBe(0);
  });
});
