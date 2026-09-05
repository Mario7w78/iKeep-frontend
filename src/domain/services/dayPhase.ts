/**
 * Fase del día para el paisaje loto.
 *
 * El cuadro principal de Home cambia con la hora: mañana, tarde o noche.
 * Es puro y determinista para poder testear los bordes sin mover el reloj
 * del teléfono.
 */

/** Las fases coinciden con las animaciones de `lotus_landscape.riv`. */
export type FaseDelDia = 'Morning' | 'Evening' | 'Night';

/** Hora (inclusive) donde empieza la tarde. */
export const INICIO_TARDE = 15;

/** Hora (inclusive) donde empieza la noche. */
export const INICIO_NOCHE = 20;

export function faseDelDia(horaLocal: number): FaseDelDia {
  if (horaLocal >= INICIO_NOCHE) return 'Night';
  if (horaLocal >= INICIO_TARDE) return 'Evening';
  return 'Morning';
}
