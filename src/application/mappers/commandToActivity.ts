import { CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { Activity, ActivityProps, ActivityType } from '../../domain/entities/Activity';

/**
 * Convierte el comando de creacion en la entidad.
 *
 * Vivia dentro de `CreateActivityUseCase`. Se saca porque ahora hay dos
 * caminos que lo necesitan —el de siempre y el que aplica en el backend de un
 * viaje— y dos copias de esto podrian divergir en cosas que no se ven: el
 * default de `type`, el nombre cuando viene vacio, el id cuando no lo mandan.
 */
export function comandoAActividad(cmd: CreateActivityCommand): Activity {
  const props: ActivityProps = {
    id: cmd.id ? String(cmd.id) : Date.now().toString(),
    title: cmd.activityName || 'Actividad sin nombre',
    type: cmd.isFixed ? ActivityType.FIXED : ActivityType.FLEXIBLE,
    area: cmd.area,
    identity: cmd.identity,
    priority: cmd.priority,
    difficulty: cmd.difficulty,
    deadline: cmd.deadline,
    daysConfig: cmd.daysConfig,
    daysEnabled: cmd.days,
    preferredStartTime: cmd.preferredStartTime,
    preferredEndTime: cmd.preferredEndTime,
    optionalDay: cmd.optionalDay ?? false,
    dayFrom: cmd.dayFrom,
    dayTo: cmd.dayTo,
    isAnchor: cmd.isAnchor ?? false,
  };

  return new Activity(props);
}
