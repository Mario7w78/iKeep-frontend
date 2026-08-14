/**
 * Cuándo ofrecer el cierre del día.
 *
 * Es una decisión delicada: aparecer a las tres de la tarde con "¿cómo te fue
 * hoy?" es interrumpir un día que todavía está pasando, y aparecer todos los
 * días aunque no haya nada sin responder convierte una pregunta en un peaje.
 *
 * Lógica pura y determinista, en código y no en la pantalla, porque las
 * condiciones son varias y equivocarse en una sola vuelve la app molesta.
 */

/** Antes de esta hora el día todavía está pasando. */
export const HORA_DE_CIERRE = 20;

export interface Situacion {
  /** Hora local, 0–23. */
  hora: number;
  /** Ocurrencias del día que ya terminaron y nadie respondió. */
  sinResolver: number;
  /** Si el usuario ya respondió el cierre de este día. */
  yaCerro: boolean;
}

/**
 * Si corresponde ofrecerlo ahora.
 *
 * Las tres condiciones son necesarias. La tercera —`yaCerro`— es la que
 * evita el peor caso: volver a preguntar lo que la persona ya contestó, que
 * es la forma más rápida de enseñarle a ignorar la pregunta.
 */
export function correspondeOfrecerCierre({
  hora,
  sinResolver,
  yaCerro,
}: Situacion): boolean {
  if (yaCerro) return false;
  if (sinResolver <= 0) return false;
  return hora >= HORA_DE_CIERRE;
}
