/**
 * Qué animación le toca a cada estado de la mascota.
 *
 * Solo traduce vocabulario de la app a nombres de animación del archivo
 * Rive. No carga ningún asset acá: cargar con `require()` desde un módulo
 * importado por media app era justo lo que tiraba abajo las pantallas
 * cuando faltaba un JSON. El `.riv` lo resuelve el componente, con guarda,
 * y este módulo queda puro.
 */

import type { EtapaSapo } from '../../../../domain/services/frogStage';

export type SapoState =
  | 'idle'
  | 'thinking'
  | 'happy'
  | 'celebrating'
  | 'sad'
  | 'sleeping'
  | 'waving';

/** Los estados que hoy tienen animación propia en el archivo. */
export const ESTADOS_CON_ANIMACION: SapoState[] = [
  'idle',
  'waving',
  'happy',
  'celebrating',
];

export interface AnimacionSapo {
  /** La que identifica al estado. */
  principal: string;
  /** Loop de ambiente que corre encima (el parpadeo). */
  ambiental?: string;
  /** Si el estado se repite hasta que algo lo cambie. */
  enBucle: boolean;
}

const EN_REPOSO: AnimacionSapo = { principal: 'Idle', ambiental: 'Blinking', enBucle: true };

/**
 * El mapeo para una etapa dada.
 *
 * `Waving tail` solo existe en el artboard del bebé: en las otras etapas
 * el saludo cae a reposo, que es mejor que pedirle al runtime una
 * animación que no está. Alegrarse y celebrar comparten `Jumping`;
 * cuando haya una celebración más grande, se separa acá y nadie más se
 * entera.
 */
export function animacionDe(estado: SapoState, etapa: EtapaSapo): AnimacionSapo {
  switch (estado) {
    case 'happy':
    case 'celebrating':
      return { principal: 'Jumping', enBucle: false };
    case 'waving':
      return etapa === 'bebé'
        ? { principal: 'Waving tail', enBucle: false }
        : EN_REPOSO;
    default:
      // Degradar a reposo es preferible a no mostrar nada: la mascota
      // sigue presente y la pantalla no cambia de forma.
      return EN_REPOSO;
  }
}
