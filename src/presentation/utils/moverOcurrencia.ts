import { Alert } from 'react-native';

import { Activity, DayOfWeek } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';
import { useActivityStore, useScheduleStore } from '../../di/Dependencies';
import { useCalendarStore } from '../../infrastructure/store/useCalendarStore';
import { JS_DAY_TO_DAYOFWEEK } from './scheduleUtils';
import { areOverlapping } from './timeUtils';

/**
 * Por qué conviene preguntar antes de mover una ocurrencia a otro día.
 *
 * Mover es reversible a mano (se puede volver a mover), pero una actividad a
 * hora fija suele tener un lugar intocable en la semana, y el día destino
 * puede tener ya otra actividad a la misma hora. Antes de pisar cualquiera de
 * las dos, se avisa.
 */
export function avisosAlMover(
  activityId: string,
  nuevaFecha: string,
  actividad: Activity | null | undefined,
  schedule: Schedule | null,
): string[] {
  const avisos: string[] = [];

  if (actividad?.isFixed()) {
    avisos.push(`«${actividad.title}» es una actividad a hora fija.`);
  }

  const bloque = schedule
    ?.getAllItems()
    .find((item) => item.activity?.id === activityId);
  const dia = diaDeLaFecha(nuevaFecha);

  if (schedule && bloque && dia) {
    const inicio = aMinutos(bloque.assignedStartTime);
    const fin = aMinutos(bloque.assignedEndTime);

    const choques = schedule
      .getItemsByDay(dia)
      .filter((item) => item.activity && item.activity.id !== activityId)
      .filter((item) =>
        areOverlapping(
          inicio,
          fin,
          aMinutos(item.assignedStartTime),
          aMinutos(item.assignedEndTime),
        ),
      );

    for (const choque of choques) {
      const titulo = choque.activity?.title ?? choque.nombre ?? 'Otra actividad';
      avisos.push(
        `Ese día ya tenés «${titulo}» de ${choque.assignedStartTime} a ${choque.assignedEndTime}.`,
      );
    }
  }

  return avisos;
}

/**
 * Mueve una ocurrencia, preguntando antes si hay algo que el usuario deba
 * saber (actividad fija o choque con el horario del día destino). Sin avisos,
 * mueve directo: no se agrega fricción cuando no hay nada que decidir.
 */
export function moverOcurrencia(
  activityId: string,
  fecha: string,
  nuevaFecha: string,
  actividad?: Activity | null,
): Promise<void> {
  const mover = () =>
    useCalendarStore.getState().mover(activityId, fecha, nuevaFecha);

  const activity =
    actividad ??
    useActivityStore.getState().activities.find((a) => a.id === activityId) ??
    null;
  const avisos = avisosAlMover(
    activityId,
    nuevaFecha,
    activity,
    useScheduleStore.getState().schedule,
  );

  if (avisos.length === 0) return mover();

  return new Promise((resolve, reject) => {
    Alert.alert(
      '¿Moverla igual?',
      avisos.join('\n\n'),
      [
        { text: 'Dejarla', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Mover',
          onPress: () => {
            mover().then(resolve, reject);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve() },
    );
  });
}

function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function diaDeLaFecha(fecha: string): DayOfWeek | null {
  const [y, m, d] = fecha.split('-').map(Number);
  if (!y || !m || !d) return null;
  return JS_DAY_TO_DAYOFWEEK[new Date(y, m - 1, d).getDay()] ?? null;
}
