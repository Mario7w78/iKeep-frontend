import { areaDesdeIdentidad } from '../../domain/entities/lifeArea';
import { desdeBanderas } from '../../domain/entities/activityBehavior';
import { BorradorWizard } from '../../infrastructure/store/useWizardDraftStore';
import { ParsedFormState } from './parseNlMapper';

/**
 * Lleva lo que el asistente entendió al borrador del wizard.
 *
 * Es el puente que faltaba entre los dos caminos. Hoy el chat y el formulario
 * son mundos incomunicados: si el asistente casi acierta, el usuario tiene que
 * cancelar y rehacer todo a mano. Con esto, "ajustar detalles" abre el wizard
 * con lo que ya se había entendido.
 *
 * Se apoya en el borrador que el wizard ya sabe restaurar en vez de inventar
 * un canal nuevo: menos piezas y un solo lugar donde el formulario se llena
 * desde afuera.
 */
export function formStateToDraft(
  estado: ParsedFormState
): Omit<BorradorWizard, 'guardadoEn'> {
  return {
    activityName: estado.activityName ?? '',
    area: areaDesdeIdentidad(estado.identity ?? undefined),
    identity: estado.identity ?? 'tarea',
    comportamiento: desdeBanderas(estado.isFixed, estado.isAnchor),
    selectedDays: estado.selectedDays ?? [],
    daysDict: estado.daysDict ?? {},
    difficulty: estado.difficulty ?? 'media',
    priority: estado.priority ?? 'media',
    // El borrador viaja por AsyncStorage, así que las fechas van como texto:
    // un Date no sobrevive la serialización y volvería como string igual,
    // pero sin que nadie lo haya decidido.
    deadline: null,
  };
}
