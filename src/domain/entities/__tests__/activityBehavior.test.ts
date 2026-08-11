/**
 * El eje único de decisión.
 *
 * Reemplaza a las dos taxonomías que convivían —"Identidad" y "Tipo"— y que
 * estaban acopladas por efectos ocultos. Aquí se fija que la traducción a las
 * banderas internas sea completa y reversible: si no lo fuera, reabrir una
 * actividad guardada mostraría una opción distinta de la que el usuario
 * eligió.
 */

import {
  aBanderas,
  desdeBanderas,
  OPCIONES_COMPORTAMIENTO,
  ComportamientoActividad,
} from '../activityBehavior';

describe('aBanderas', () => {
  it('hora fija ancla la actividad a un horario concreto', () => {
    expect(aBanderas('horaFija')).toEqual({ isFixed: true, isAnchor: false });
  });

  it('dia fijo delega la hora al solver', () => {
    /** El usuario pone el dia, el sistema la hora: por eso no es fija. */
    expect(aBanderas('diaFijo')).toEqual({ isFixed: false, isAnchor: true });
  });

  it('flexible no fija nada', () => {
    expect(aBanderas('flexible')).toEqual({ isFixed: false, isAnchor: false });
  });
});

describe('desdeBanderas', () => {
  it('reconoce una actividad a hora fija', () => {
    expect(desdeBanderas(true, false)).toBe('horaFija');
  });

  it('reconoce una anclada al dia', () => {
    expect(desdeBanderas(false, true)).toBe('diaFijo');
  });

  it('reconoce una flexible', () => {
    expect(desdeBanderas(false, false)).toBe('flexible');
  });

  it('con ambas banderas gana la hora fija', () => {
    /** Es un estado imposible que igual puede llegar de datos viejos; se
     *  resuelve por la opcion mas especifica en vez de romper. */
    expect(desdeBanderas(true, true)).toBe('horaFija');
  });
});

describe('ida y vuelta', () => {
  const todas: ComportamientoActividad[] = ['horaFija', 'diaFijo', 'flexible'];

  it.each(todas)('%s sobrevive el viaje completo', (comportamiento) => {
    /** Si no fuera reversible, reabrir una actividad guardada mostraria una
     *  opcion distinta de la que el usuario eligio. */
    const { isFixed, isAnchor } = aBanderas(comportamiento);

    expect(desdeBanderas(isFixed, isAnchor)).toBe(comportamiento);
  });
});

describe('opciones que se le muestran al usuario', () => {
  it('hay una por cada comportamiento posible', () => {
    expect(OPCIONES_COMPORTAMIENTO.map((o) => o.valor)).toEqual([
      'horaFija',
      'diaFijo',
      'flexible',
    ]);
  });

  it('ninguna usa vocabulario interno', () => {
    /** "Optimizable" y "Anclaje de dia" no significan nada para quien recien
     *  abre la app. */
    const texto = OPCIONES_COMPORTAMIENTO.map((o) => `${o.titulo} ${o.ejemplo}`)
      .join(' ')
      .toLowerCase();

    for (const jerga of ['optimizable', 'anclaje', 'ancla', 'partición', 'fijo']) {
      expect(texto).not.toContain(jerga);
    }
  });

  it('cada opcion trae un ejemplo concreto', () => {
    /** El titulo solo no alcanza: el ejemplo es lo que desambigua. */
    for (const opcion of OPCIONES_COMPORTAMIENTO) {
      expect(opcion.ejemplo.length).toBeGreaterThan(20);
    }
  });
});
