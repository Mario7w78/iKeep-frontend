/**
 * El `.riv` de la mascota, cargado con guarda.
 *
 * Rive es un módulo nativo y el asset vive en el bundle: si cualquiera de
 * los dos no está —un dev client sin reconstruir, un asset que no viajó—
 * importarlo directo tiraría abajo cada pantalla que pinta la mascota.
 * La mascota es decoración: si falta, se reserva el hueco y nada más.
 */

let fuente: number | null = null;
try {
  fuente = require('../../../../../assets/mascot/sapo_animations.riv');
} catch {
  fuente = null;
}

export const FUENTE_SAPO = fuente;
