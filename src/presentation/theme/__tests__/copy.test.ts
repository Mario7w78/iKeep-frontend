/**
 * El glosario existe para que el mismo concepto no vuelva a tener nombres
 * distintos segun la pantalla. Estos tests fijan las decisiones tomadas.
 */

import { COPY, DIA_CORTO } from '../copy';

describe('COPY', () => {
  it('una actividad sin hora fija se llama Flexible en todos lados', () => {
    /** Era "Optimizable" en el wizard y "Horario Flexible" en el chat. */
    expect(COPY.flexible).toBe('Flexible');
  });

  it('los dias son solo "Dias", sin adjetivos', () => {
    /** Eran "Dias programados" en un lado y "Dias asignados" en otro. */
    expect(COPY.dias).toBe('Días');
  });

  it('un tramo de tiempo es un turno', () => {
    /** Se llamaba "Horario", "turno", "capa" y "bloque horario". Se elige
     *  turno porque es la unica que un estudiante usa al hablar. */
    expect(COPY.turno).toBe('Turno');
  });

  it('el valor intermedio se llama igual en las dos escalas', () => {
    /** Era "Normal" en dificultad y "Media" en prioridad: la misma posicion
     *  de la misma escala con dos nombres. */
    expect(COPY.media).toBe('Media');
  });
});

describe('DIA_CORTO', () => {
  it('usa tres letras y no una', () => {
    /** Con una sola letra hay que resolver la ambiguedad entre martes y
     *  miercoles, y entre sabado y domingo, cada vez. */
    expect(DIA_CORTO.Miercoles).toBe('Mié');
    expect(DIA_CORTO.Martes).toBe('Mar');
  });

  it('acepta el dia con y sin tilde', () => {
    expect(DIA_CORTO['Miércoles']).toBe(DIA_CORTO.Miercoles);
    expect(DIA_CORTO['Sábado']).toBe(DIA_CORTO.Sabado);
  });

  it('cubre la semana entera', () => {
    const unicos = new Set(Object.values(DIA_CORTO));
    expect(unicos.size).toBe(7);
  });
});
