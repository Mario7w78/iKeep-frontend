/**
 * Sugerencias de apertura del chat (item 14).
 *
 * Antes eran tres ejemplos estáticos de lo que el asistente sabe hacer. Ahora
 * son híbridas: se mezclan las capacidades que conviene mostrar siempre
 * (consultar agenda, aprovechar tiempo libre, reorganizar) con datos reales
 * del usuario —cuántas horas libres tiene hoy, si mañana tiene agenda— y en
 * español neutro, sin voseo.
 *
 * Función pura, testable en aislamiento: el hook que la alimenta con los
 * stores vive en useSugerenciasSapo.ts.
 */

import { JS_DAY_TO_DAYOFWEEK } from "../../utils/scheduleUtils";

export interface SugerenciasSapoDatos {
  /** Cuántas actividades tiene el usuario cargadas. */
  cantidadActividades: number;
  /** true si ya existe un horario generado. */
  hayHorario: boolean;
  /** Minutos libres de hoy desde la hora actual (null si no aplica). */
  freeTimeMinutes: number | null;
  /** true si mañana tiene actividades agendadas. */
  mananaTieneActividades: boolean;
}

const AGREGAR_ALGO = "Quiero crear mi primera actividad";
const CONSULTAR_AGENDA = "¿Qué tengo mañana?";
const TIEMPO_LIBRE = "Tengo 2 horas libres";
const REORGANIZAR = "Quiero reorganizar mi semana";

/**
 * Formatea los minutos libres a una consulta en español neutro.
 * Ej: 45 → "Tengo 45 minutos libres", 90 → "Tengo 1 hora y media libres".
 */
export function formatearTiempoLibre(min: number): string {
  if (min < 60) return `Tengo ${min} minutos libres`;
  const horas = min / 60;
  const entero = Math.floor(horas);
  const media = horas - entero >= 0.5;
  const parte = media
    ? `${entero} hora${entero > 1 ? "s" : ""} y media`
    : `${entero} hora${entero > 1 ? "s" : ""}`;
  return `Tengo ${parte} libres`;
}

/**
 * Construye hasta tres sugerencias, priorizando los datos reales y
 * completando con las estáticas para que no quede menos de ese número:
 * el chat siempre abre con opciones, sean contextuales o de relleno.
 */
export function construirSugerenciasSapo(datos: SugerenciasSapoDatos): string[] {
  const { cantidadActividades, hayHorario, freeTimeMinutes, mananaTieneActividades } = datos;

  if (cantidadActividades === 0) {
    return [AGREGAR_ALGO, TIEMPO_LIBRE, CONSULTAR_AGENDA];
  }

  if (!hayHorario) {
    return [CONSULTAR_AGENDA, TIEMPO_LIBRE, REORGANIZAR];
  }

  const listo: string[] = [];

  if (freeTimeMinutes !== null && freeTimeMinutes > 0) {
    listo.push(formatearTiempoLibre(freeTimeMinutes));
  }

  // Solo se ofrece este atajo cuando realmente es mañana el próximo día con
  // actividad; si no hay agenda próxima no tiene sentido pintarlo como real.
  if (mananaTieneActividades) {
    listo.push(CONSULTAR_AGENDA);
  }

  for (const s of [REORGANIZAR, TIEMPO_LIBRE]) {
    if (listo.length >= 3) break;
    if (!listo.includes(s)) listo.push(s);
  }

  return listo.slice(0, 3);
}

/** true si `proximoDia` (nombre de día) cae justo mañana. */
export function esManana(proximoDia: string | null, hoy: Date): boolean {
  if (!proximoDia) return false;
  const manana = JS_DAY_TO_DAYOFWEEK[(hoy.getDay() + 1) % 7];
  return proximoDia === manana;
}