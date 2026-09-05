import { Activity } from '../../domain/entities/Activity';
import { ActivityDto, dtoToActivity } from '../repositories/ApiActivityRepository';
import { backendRequest } from './backendClient';

/**
 * El calendario con fechas reales.
 *
 * Hasta ahora el horario guardaba días de la semana y esa semana se repetía
 * indefinidamente. El servidor expande esa plantilla a fechas concretas,
 * aplica las excepciones y suma los eventos únicos — que es lo que hacen
 * Google Calendar y el de Apple.
 */

const RUTA = '/api/v1/calendario';

/** El servidor rechaza rangos mayores. Un mes con sus bordes entra holgado. */
export const MAXIMO_DIAS = 120;

export interface Ocurrencia {
  fecha: string;
  actividad: Activity;
  /** De dónde se movió, si se movió. Permite decir "reprogramada". */
  movidaDesde: string | null;
  esUnica: boolean;
}

export type TipoExcepcion = 'cancelada' | 'movida';

/** `YYYY-MM-DD` en el día del usuario, no en UTC. */
export function aFechaLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export async function verCalendario(desde: string, hasta: string): Promise<Ocurrencia[]> {
  const dto = await backendRequest<{
    ocurrencias: {
      fecha: string;
      actividad: ActivityDto;
      movida_desde: string | null;
      es_unica: boolean;
    }[];
  }>(`${RUTA}?desde=${desde}&hasta=${hasta}`);

  return (dto?.ocurrencias ?? []).map((o) => ({
    fecha: o.fecha,
    actividad: dtoToActivity(o.actividad),
    movidaDesde: o.movida_desde,
    esUnica: o.es_unica,
  }));
}

/**
 * Cancela o mueve una ocurrencia.
 *
 * PUT: hay como máximo una excepción por (actividad, fecha), así que repetir
 * la llamada reemplaza en vez de acumular.
 */
export async function guardarExcepcion(params: {
  activityId: string;
  fecha: string;
  tipo: TipoExcepcion;
  nuevaFecha?: string;
}): Promise<void> {
  await backendRequest<void>(`${RUTA}/excepciones`, {
    method: 'PUT',
    body: {
      activity_id: params.activityId,
      fecha: params.fecha,
      tipo: params.tipo,
      nueva_fecha: params.nuevaFecha ?? null,
    },
  });
}

/** Deshace la excepción: la ocurrencia vuelve a su lugar. */
export async function borrarExcepcion(activityId: string, fecha: string): Promise<void> {
  await backendRequest<void>(
    `${RUTA}/excepciones?activity_id=${encodeURIComponent(activityId)}&fecha=${fecha}`,
    { method: 'DELETE' }
  );
}
