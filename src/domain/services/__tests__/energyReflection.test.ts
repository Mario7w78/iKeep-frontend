/**
 * Lo que la app devuelve cuando el usuario dice como esta.
 *
 * El check-in era mudo: se guardaban 90 dias de energia y nunca volvian.
 * Preguntar y no hacer nada visible ensena que la pregunta es decorativa.
 *
 * Convencion de estos tests: HOY es el 12. `dias(...)` construye los dias
 * ANTERIORES, del mas reciente hacia atras. El nivel de hoy va aparte, porque
 * asi lo llama la pantalla: el usuario acaba de tocarlo y todavia no se
 * guardo.
 */

import { reflexionar } from '../energyReflection';

const HOY = '2026-08-12';

function dias(...niveles: number[]) {
  return niveles.map((nivel, i) => {
    const d = new Date(2026, 7, 11 - i, 12);
    return { timestamp: d.toISOString(), nivel, dia_semana: d.getDay() };
  }) as any[];
}

/** Un registro a la hora que se indique, en el huso del usuario. */
function aLas(hora: number, dia: number, nivel: number) {
  return {
    timestamp: new Date(2026, 7, dia, hora).toISOString(),
    nivel,
    dia_semana: 0,
  } as any;
}

describe('sin historial suficiente', () => {
  it('el primer dia no dice nada', () => {
    expect(reflexionar(3, [], HOY).texto).toBeNull();
  });

  it('callarse es una respuesta valida', () => {
    // Un dia igual al anterior no es una racha ni un cambio ni un patron.
    expect(reflexionar(2, dias(2), HOY).texto).toBeNull();
  });
});

describe('dias seguidos en la misma banda', () => {
  it('tres seguidos se nombran', () => {
    const r = reflexionar(1, dias(1, 1), HOY);

    expect(r.motivo).toBe('racha');
    expect(r.texto).toContain('3 días seguidos');
  });

  it('con energia baja ofrece algo, no solo senala', () => {
    // Nombrar un mal tramo sin salida es unicamente subrayarlo.
    expect(reflexionar(1, dias(1, 1), HOY).texto).toContain('aligerar');
  });

  it('con energia alta no ofrece nada, solo lo nombra', () => {
    const r = reflexionar(3, dias(3, 3), HOY);

    expect(r.texto).toContain('alta');
    expect(r.texto).not.toContain('aligerar');
  });

  it('la escala del reporte diario es 1-3, no 1-5', () => {
    // 1-5 es el nivel del PERFIL. Confundirlos hace que un 2 —"normal"— se
    // lea como energia baja y la app avise de un bajon que no existe.
    expect(reflexionar(2, dias(2, 2), HOY).texto).toContain('estable');
  });

  it('un dia distinto corta la racha', () => {
    expect(reflexionar(1, dias(2, 1), HOY).motivo).not.toBe('racha');
  });
});

describe('cambios respecto de ayer', () => {
  it('salir de un dia bajo se reconoce', () => {
    const r = reflexionar(3, dias(1), HOY);

    expect(r.motivo).toBe('cambio');
    expect(r.texto).toContain('Hoy mejor');
  });

  it('bajar se dice sin dramatizar', () => {
    const r = reflexionar(1, dias(3), HOY);

    expect(r.texto).toContain('Tenlo en cuenta');
    expect(r.texto).not.toMatch(/mal\b|peor|cuidado/i);
  });
});

describe('el patron propio', () => {
  it('no se afirma con cuatro dias de datos', () => {
    // Inventar un patron quema la credibilidad de todos los siguientes.
    expect(reflexionar(3, dias(2, 2, 2, 2), HOY).motivo).not.toBe('patron');
  });

  it('con historial suficiente si', () => {
    expect(reflexionar(3, dias(...Array(16).fill(2)), HOY).motivo).toBe('patron');
  });
});

describe('bordes', () => {
  it('dos reportes el mismo dia cuentan una vez', () => {
    // Cambiar de opinion a las dos horas es normal; vale el ultimo.
    const mismoDia = [aLas(20, 11, 1), aLas(9, 11, 3), aLas(12, 10, 1)];

    expect(reflexionar(1, mismoDia, HOY).texto).toContain('3 días seguidos');
  });

  it('un reporte de noche pertenece al dia del usuario, no al UTC', () => {
    // A las 20:00 en Lima el ISO ya dice manana. Si se leyera asi, este
    // registro contaria como de hoy y partiria la racha en dos.
    expect(reflexionar(1, [aLas(20, 11, 1), aLas(20, 10, 1)], HOY).texto)
      .toContain('3 días seguidos');
  });

  it('el registro de hoy ya guardado no se cuenta dos veces', () => {
    // La pantalla puede llamar antes o despues de guardar; da lo mismo.
    const conHoy = [aLas(10, 12, 1), ...dias(1, 1)];

    expect(reflexionar(1, conHoy, HOY).texto).toContain('3 días seguidos');
  });

  it('nunca reprocha', () => {
    const textos = [
      reflexionar(1, dias(1, 1), HOY),
      reflexionar(1, dias(3), HOY),
      reflexionar(2, dias(2, 2), HOY),
    ].map((r) => r.texto ?? '');

    for (const t of textos) {
      expect(t).not.toMatch(/deberías|fallaste|otra vez|de nuevo/i);
    }
  });
});
