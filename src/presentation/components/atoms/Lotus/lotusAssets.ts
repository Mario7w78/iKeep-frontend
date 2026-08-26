/**
 * El `.riv` del paisaje loto, cargado con guarda.
 *
 * Misma razón que el sapo: si el asset o el nativo no están, la pantalla
 * principal no se puede venir abajo por una decoración.
 */

let fuente
try {
  fuente = require('../../../../../assets/mascot/lotus_landscape.riv');
} catch {
  fuente = null;
}

export const FUENTE_LOTUS = fuente;
