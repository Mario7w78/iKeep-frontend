/**
 * Lo que el horario le cuenta al backend cuando pide replanificar.
 *
 * El backend decide que puede mover leyendo `es_fija`. Si el mapeador no lo
 * manda, el arreglo del replanificador existe en el servidor y no sirve de
 * nada: el turno de trabajo del usuario se sigue moviendo.
 */

import { Activity, ActivityType } from '../../../../domain/entities/Activity';
import { scheduleToBloqueTiempo } from '../rescheduleMapper';

function actividad(id: string, type: ActivityType) {
  return new Activity({
    id,
    title: id,
    type,
    identity: 'trabajo',
    priority: 3,
    difficulty: 'media',
    daysEnabled: ['Lunes'],
    daysConfig: {},
  } as any);
}

function horarioCon(items: any[]) {
  return { getAllItems: () => items } as any;
}

const item = (act: Activity, tipo: string) => ({
  activity: act,
  tipo,
  day: 'Lunes',
  assignedStartTime: '09:00',
  assignedEndTime: '17:00',
});

describe('scheduleToBloqueTiempo', () => {
  it('un trabajo con hora fija viaja marcado como fijo', () => {
    // El rotulo dice "trabajo" y antes eso bastaba para que el solver lo
    // reubicara. Lo que decide es el comportamiento.
    const bloques = scheduleToBloqueTiempo(
      horarioCon([item(actividad('turno', ActivityType.FIXED), 'trabajo')])
    );

    expect(bloques[0].es_fija).toBe(true);
  });

  it('una clase flexible viaja como movible', () => {
    const bloques = scheduleToBloqueTiempo(
      horarioCon([item(actividad('ingles', ActivityType.FLEXIBLE), 'clase')])
    );

    expect(bloques[0].es_fija).toBe(false);
  });

  it('nunca lo deja sin definir', () => {
    // `undefined` significa "bloque viejo" del lado del servidor, que aplica
    // la regla anterior. Mandarlo desde una version nueva reviviria el bug.
    const bloques = scheduleToBloqueTiempo(
      horarioCon([
        item(actividad('a', ActivityType.FIXED), 'clase'),
        item(actividad('b', ActivityType.FLEXIBLE), 'tarea'),
      ])
    );

    for (const b of bloques) expect(typeof b.es_fija).toBe('boolean');
  });
});
