/**
 * Que avisos merecen una notificacion.
 *
 * Lo dificil no es enviarlas: es no enviarlas. Una app que avisa todos los
 * dias de lo mismo se silencia, y el permiso se pierde una sola vez.
 */

import {
  AVISO_MATUTINO,
  AVISO_RACHA,
  avisosQueCorresponden,
} from '../reengagementReminders';

const BASE = { rachaActual: 0, diaTerminado: false, actividadesHoy: 0 };

function ids(estado: any) {
  return avisosQueCorresponden(estado).map((a) => a.identifier);
}

describe('resumen matutino', () => {
  it('se manda si hay algo agendado', () => {
    expect(ids({ ...BASE, actividadesHoy: 3 })).toContain(AVISO_MATUTINO);
  });

  it('un dia libre no genera aviso', () => {
    // Un "buenos dias" a secas es ruido, y el ruido apaga las notificaciones.
    expect(ids({ ...BASE, actividadesHoy: 0 })).not.toContain(AVISO_MATUTINO);
  });

  it('el singular se respeta', () => {
    const aviso = avisosQueCorresponden({ ...BASE, actividadesHoy: 1 })[0];

    expect(aviso.body).toContain('una actividad');
  });

  it('llega temprano pero no de madrugada', () => {
    const aviso = avisosQueCorresponden({ ...BASE, actividadesHoy: 2 })[0];

    expect(aviso.hour).toBeGreaterThanOrEqual(7);
    expect(aviso.hour).toBeLessThanOrEqual(9);
  });
});

describe('racha en riesgo', () => {
  it('avisa si hay racha y el dia sigue abierto', () => {
    expect(ids({ ...BASE, rachaActual: 5 })).toContain(AVISO_RACHA);
  });

  it('sin racha no se avisa: no hay nada que perder', () => {
    expect(ids({ ...BASE, rachaActual: 0 })).not.toContain(AVISO_RACHA);
  });

  it('con el dia ya terminado tampoco', () => {
    expect(ids({ ...BASE, rachaActual: 5, diaTerminado: true })).not.toContain(
      AVISO_RACHA
    );
  });

  it('llega con tiempo para reaccionar', () => {
    // A las 22:00 el aviso ya no es un recordatorio, es un reproche.
    const aviso = avisosQueCorresponden({ ...BASE, rachaActual: 3 })[0];

    expect(aviso.hour).toBeLessThanOrEqual(20);
  });

  it('nombra lo que puede hacer, no lo que puede perder', () => {
    const aviso = avisosQueCorresponden({ ...BASE, rachaActual: 3 })[0];

    expect(aviso.body).not.toMatch(/perder|perderás|pierdes/i);
    expect(aviso.title).toContain('3');
  });
});

describe('el conjunto completo', () => {
  it('devuelve los dos cuando corresponden los dos', () => {
    expect(ids({ rachaActual: 4, diaTerminado: false, actividadesHoy: 2 })).toHaveLength(2);
  });

  it('un dia libre sin racha no genera nada', () => {
    // Lo que no esta en la lista se cancela: el estado se deduce de aca.
    expect(avisosQueCorresponden(BASE)).toEqual([]);
  });
});
