import { backendRequest } from './backendClient';

/**
 * Completar actividades, racha y progreso del dia.
 *
 * Hasta ahora no habia forma de marcar nada como hecho, asi que no existia el
 * evento que todo lo demas necesita: sin "termine esto" no hay racha, ni
 * progreso, ni nada que la mascota pueda celebrar.
 */

const RUTA = '/api/v1/logros';

export interface Racha {
  actual: number;
  mejor: number;
  /** Hay racha viva pero hoy todavia no se completo nada. */
  enRiesgo: boolean;
}

export interface ProgresoDelDia {
  completadas: number;
  total: number;
  /** Entre 0 y 1. Un dia sin nada programado vale 1: no hay nada pendiente. */
  fraccion: number;
  terminado: boolean;
  completadosIds: string[];
}

export interface ResumenDeLogros {
  racha: Racha;
  progreso: ProgresoDelDia;
  /** Días con al menos algo hecho, en formato `YYYY-MM-DD`. */
  diasCompletados: string[];
}

/**
 * El dia del usuario, no el del servidor.
 *
 * `toISOString()` normaliza a UTC, asi que a las 21:00 en Lima devolveria el
 * dia siguiente: alguien que completa algo de noche lo veria contado manana y
 * su racha de hoy quedaria vacia.
 */
export function fechaLocal(momento: Date = new Date()): string {
  const mes = String(momento.getMonth() + 1).padStart(2, '0');
  const dia = String(momento.getDate()).padStart(2, '0');
  return `${momento.getFullYear()}-${mes}-${dia}`;
}

export async function completarActividad(activityId: string, fecha = fechaLocal()): Promise<void> {
  await backendRequest<void>(`${RUTA}/completar`, {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, fecha }),
  });
}

export async function descompletarActividad(activityId: string, fecha = fechaLocal()): Promise<void> {
  await backendRequest<void>(`${RUTA}/descompletar`, {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, fecha }),
  });
}

export async function obtenerResumen(fecha = fechaLocal()): Promise<ResumenDeLogros> {
  const dto = await backendRequest<any>(`${RUTA}/resumen?fecha=${fecha}`);
  return {
    racha: {
      actual: dto.racha.actual,
      mejor: dto.racha.mejor,
      enRiesgo: dto.racha.en_riesgo,
    },
    progreso: {
      completadas: dto.progreso.completadas,
      total: dto.progreso.total,
      fraccion: dto.progreso.fraccion,
      terminado: dto.progreso.terminado,
      completadosIds: dto.progreso.completados_ids ?? [],
    },
    diasCompletados: dto.dias_completados ?? [],
  };
}
