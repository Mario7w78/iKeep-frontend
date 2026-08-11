import { aBanderas, ComportamientoActividad } from '../../domain/entities/activityBehavior';
import { ParsedFormState } from './parseNlMapper';

export interface EstadoDelWizard {
  activityName: string;
  identity: 'clase' | 'trabajo' | 'tarea';
  comportamiento: ComportamientoActividad;
  selectedDays: string[];
  daysDict: Record<string, any>;
  difficulty: 'baja' | 'media' | 'alta';
  priority: 'baja' | 'media' | 'alta';
}

/**
 * Devuelve al chat lo que el usuario dejó en el wizard.
 *
 * El camino de ida ya existía —`formStateToDraft`— pero era de una sola
 * dirección: quien ajustaba en el formulario volvía al chat y encontraba la
 * tarjeta con los valores viejos, todavía pendiente. Confirmarla ahí creaba
 * una segunda actividad.
 *
 * Devuelve un parche y no un `ParsedFormState` entero a propósito: el wizard
 * no conoce campos como `duracionMinutos` o `dayOnlySlots`, que el asistente
 * dedujo de la conversación. Pisarlos con un valor inventado sería peor que
 * dejarlos como están.
 */
export function wizardStateToParsed(
  estado: EstadoDelWizard
): Partial<ParsedFormState> {
  const { isFixed, isAnchor } = aBanderas(estado.comportamiento);

  return {
    activityName: estado.activityName,
    identity: estado.identity,
    isFixed,
    isAnchor,
    selectedDays: estado.selectedDays as ParsedFormState['selectedDays'],
    daysDict: estado.daysDict,
    difficulty: estado.difficulty,
    priority: estado.priority,
  };
}
