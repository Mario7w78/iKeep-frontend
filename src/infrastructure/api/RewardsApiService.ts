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
  /** Lo que se dijo que SÍ. Es lo único que cuenta como progreso. */
  completadosIds: string[];
  /**
   * Lo que se dijo que NO.
   *
   * Va aparte porque hay TRES situaciones y no dos: hecha, no hecha, y la
   * ausencia —que es «sin resolver»—. Sin esta lista, «me contestaste que no»
   * y «todavía no me contestaste» se ven igual, y el cierre del día vuelve a
   * preguntar lo que el usuario ya respondió.
   */
  noHechasIds: string[];
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

/** Qué se está afirmando. `sin resolver` no se manda: es la ausencia de dato. */
export type EstadoCompletado = 'hecha' | 'no_hecha';

/** De dónde vino. No hay "automático": nunca se marca sola. */
export type OrigenCompletado = 'sesion' | 'manual' | 'cierre';

export type RespuestaDeCierre = 'todo' | 'algunas' | 'dificil';

/** El desfase del cliente, con el signo que espera el backend. */
function desfase(): number {
  return -new Date().getTimezoneOffset();
}

export async function completarActividad(
  activityId: string,
  fecha = fechaLocal(),
  estado: EstadoCompletado = 'hecha',
  origen: OrigenCompletado = 'manual'
): Promise<void> {
  await backendRequest<void>(`${RUTA}/completar`, {
    method: 'POST',
    body: JSON.stringify({
      activity_id: activityId,
      fecha,
      estado,
      origen,
      // El servidor valida que la fecha no sea futura ni esté fuera de plazo,
      // y para eso necesita saber qué día es acá: con su medianoche, en Lima
      // rechazaría marcar hoy durante cinco horas.
      desfase_utc_minutos: desfase(),
    }),
  });
}

/**
 * Resuelve de una vez todo lo que quedó sin decir ese día.
 *
 * Es la red de seguridad del sistema: abrir a las once de la noche con el día
 * entero sin marcar es el caso más frecuente, no el raro.
 */
export async function cerrarDia(
  respuesta: RespuestaDeCierre,
  hechas: string[] = [],
  fecha = fechaLocal()
): Promise<ProgresoDelDia> {
  const dto = await backendRequest<any>(`${RUTA}/cerrar-dia`, {
    method: 'POST',
    body: JSON.stringify({
      fecha,
      respuesta,
      hechas,
      desfase_utc_minutos: desfase(),
    }),
  });
  return {
    completadas: dto.completadas,
    total: dto.total,
    fraccion: dto.fraccion,
    terminado: dto.terminado,
    completadosIds: dto.completados_ids ?? [],
    noHechasIds: dto.no_hechas_ids ?? [],
  };
}

export async function descompletarActividad(activityId: string, fecha = fechaLocal()): Promise<void> {
  await backendRequest<void>(`${RUTA}/descompletar`, {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId, fecha }),
  });
}

export async function obtenerResumen(fecha = fechaLocal()): Promise<ResumenDeLogros> {
  // La racha cuenta días en que el usuario apareció, y "el día" es el suyo:
  // sin el desfase, un check-in de las 20:00 en Lima contaría como de mañana.
  const desfase = -new Date().getTimezoneOffset();
  const dto = await backendRequest<any>(
    `${RUTA}/resumen?fecha=${fecha}&desfase_utc_minutos=${desfase}`
  );
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
      noHechasIds: dto.progreso.no_hechas_ids ?? [],
    },
    diasCompletados: dto.dias_completados ?? [],
  };
}

export interface EquilibrioDeVida {
  /** El tamaño de cada pétalo. Acumula desde siempre y nunca baja. */
  historico: Record<string, number>;
  /** La forma de la flor. Solo la ventana reciente, así que sí cambia. */
  recientes: Record<string, number>;
  dias: number;
}

/**
 * Cuánto hay de cada parte de tu vida.
 *
 * El servidor devuelve conteos, no aperturas: cuánto se abre cada pétalo y
 * cómo se dibuja la flor son decisiones de presentación que van a cambiar
 * con el arte, y no deberían pedir un redespliegue.
 */
export async function obtenerEquilibrio(fecha = fechaLocal()): Promise<EquilibrioDeVida> {
  const dto = await backendRequest<any>(`${RUTA}/equilibrio?fecha=${fecha}`);
  return {
    historico: dto?.historico ?? {},
    recientes: dto?.recientes ?? {},
    dias: dto?.dias ?? 90,
  };
}
