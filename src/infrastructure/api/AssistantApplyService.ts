import { Activity } from '../../domain/entities/Activity';
import {
  ActivityDto,
  activityToDto,
  dtoToActivity,
} from '../repositories/ApiActivityRepository';
import { backendRequest } from './backendClient';

/**
 * Aplica una propuesta ya confirmada en una sola llamada.
 *
 * Antes esto eran tres viajes que orquestaba el cliente —guardar la
 * actividad, generar el horario, persistirlo— mas la compensacion a mano si
 * el solver fallaba a mitad. En un servidor que duerme y tarda cincuenta
 * segundos en despertar, cada salto se paga.
 *
 * Lo que no cambia es quien decide: esto solo se llama despues de que el
 * usuario confirmo. El modelo propone, la persona aprueba.
 */

const RUTA = '/api/v1/asistente/aplicar';

export type TipoDeAplicacion = 'crear' | 'modificar' | 'eliminar' | 'regenerar';

interface AplicarResponseDto {
  estado: string | null;
  mensaje: string | null;
  recomendaciones: any[];
  tareas_omitidas: any[];
  scheduled_activities: any[];
  actividades: ActivityDto[];
}

export interface ResultadoAplicado {
  estado: string | null;
  mensaje: string | null;
  recomendaciones: any[];
  tareasOmitidas: any[];
  /** Ya con la forma que el store del horario sabe hidratar. */
  scheduledActivities: any[];
  /** Las actividades como quedaron, para no tener que volver a pedirlas. */
  actividades: Activity[];
}

/**
 * El desfase del reloj del dispositivo, en minutos.
 *
 * Los turnos se guardan como instantes UTC, pero la hora que importa es la
 * que el usuario ve: una clase a las 10:00 en Lima viaja como las 15:00Z, y
 * el servidor leyendola tal cual la correria cinco horas. Se manda en vez de
 * suponerla porque el servidor no tiene forma de saberla.
 *
 * `getTimezoneOffset` devuelve el signo invertido respecto de UTC —Lima da
 * 300, no -300—, asi que se niega.
 */
function desfaseDelReloj(): number {
  return -new Date().getTimezoneOffset();
}

export async function aplicarPropuesta(params: {
  tipo: TipoDeAplicacion;
  actividad?: Activity;
  activityId?: string;
  nivelEnergia?: number;
}): Promise<ResultadoAplicado> {
  const respuesta = await backendRequest<AplicarResponseDto>(RUTA, {
    method: 'POST',
    body: {
      tipo: params.tipo,
      actividad: params.actividad ? activityToDto(params.actividad) : null,
      activity_id: params.activityId ?? null,
      desfase_utc_minutos: desfaseDelReloj(),
      nivel_energia: params.nivelEnergia ?? 2,
    },
  });

  return {
    estado: respuesta.estado,
    mensaje: respuesta.mensaje,
    recomendaciones: respuesta.recomendaciones ?? [],
    tareasOmitidas: respuesta.tareas_omitidas ?? [],
    scheduledActivities: respuesta.scheduled_activities ?? [],
    actividades: (respuesta.actividades ?? []).map(dtoToActivity),
  };
}
