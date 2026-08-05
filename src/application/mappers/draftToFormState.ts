import { Borrador } from '../../domain/entities/conversation.types';
import { ParseNLResponseDto } from '../../infrastructure/api/dto/ParseNLDto';
import { mapParsedResponseToFormState, ParsedFormState } from './parseNlMapper';

/**
 * Convierte el borrador del asistente al estado del formulario.
 *
 * Delega en `mapParsedResponseToFormState` en vez de reimplementarlo. Eso es
 * posible porque el borrador del backend se diseñó con los mismos campos que
 * `ParseNLResponse`: la conversión es casi una identidad, y así la tarjeta de
 * confirmación, la validación de solapamientos y el guardado siguen
 * funcionando sin tocarse.
 *
 * Tener dos traducciones del mismo dato sería tener dos formas de que se
 * desincronicen.
 */
export function draftToFormState(
  borrador: Borrador,
  currentNextGroupId: number
): ParsedFormState {
  const dto: ParseNLResponseDto = {
    name: borrador.name ?? null,
    // El borrador admite 'viaje', que el formulario no ofrece: se degrada a
    // tarea en lugar de dejar la identidad vacía.
    activity_type:
      borrador.activity_type && borrador.activity_type !== 'viaje'
        ? borrador.activity_type
        : borrador.activity_type === 'viaje'
          ? 'tarea'
          : null,
    // El formulario necesita un booleano; null no es una tercera opción.
    is_fixed: borrador.is_fixed ?? false,
    is_anchor: borrador.is_anchor ?? false,
    difficulty: borrador.difficulty ?? null,
    priority: borrador.priority ?? null,
    schedule: (borrador.schedule ?? []).map((b) => ({
      day: b.day,
      start_time: b.start_time,
      end_time: b.end_time,
    })),
    duracion_minutos: borrador.duracion_minutos ?? null,
    hora_preferida_inicio: borrador.hora_preferida_inicio ?? null,
    hora_preferida_fin: borrador.hora_preferida_fin ?? null,
    location: borrador.location ?? null,
    travel_to: borrador.travel_to ?? null,
    travel_from: borrador.travel_from ?? null,
    // El asistente ya no reporta confianza ni campos faltantes: los slots
    // vacíos del borrador SON los faltantes, y tener las dos cosas permitía
    // que se contradijeran.
    confidence: 1,
    missing_fields: [],
  };

  return mapParsedResponseToFormState(dto, currentNextGroupId);
}
