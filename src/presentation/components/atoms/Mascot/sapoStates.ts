/**
 * Los estados de la mascota y qué animación le toca a cada uno.
 *
 * Están declarados los siete previstos aunque solo existan tres animaciones.
 * La razón es poder cablear la app entera ahora: una pantalla pide
 * `celebrating`, hoy ve el reposo, y el día que se produzca esa animación
 * empieza a verse sin tocar quien la usa.
 *
 * Degradar a reposo es mejor que no dibujar nada: la mascota sigue presente y
 * la pantalla no cambia de forma cuando aparece el archivo que falta.
 */

export type SapoState =
  | 'idle'
  | 'thinking'
  | 'happy'
  | 'celebrating'
  | 'sad'
  | 'sleeping'
  | 'waving';

const idle = require('../../../../../assets/mascot/idle.json');
const waving = require('../../../../../assets/mascot/waving.json');
const success = require('../../../../../assets/mascot/success.json');

/** Los que hoy tienen animación propia; el resto cae a reposo. */
export const ESTADOS_CON_ANIMACION: SapoState[] = [
  'idle',
  'waving',
  'happy',
  'celebrating',
];

const ANIMACIONES: Partial<Record<SapoState, unknown>> = {
  idle,
  waving,
  // Alegrarse y celebrar comparten animación por ahora. Cuando exista una
  // celebración más grande, se separan aquí y nadie más se entera.
  happy: success,
  celebrating: success,
};

/**
 * Estados que se repiten hasta que algo los cambie.
 *
 * Los demás ocurren una vez: un saludo en bucle deja de leerse como saludo, y
 * una celebración que no termina deja de celebrar nada.
 */
const EN_BUCLE: SapoState[] = ['idle', 'thinking', 'sleeping'];

/**
 * Tramo de la animación que se reproduce, en frames.
 *
 * `success` dura 7 segundos pero la celebración ocurre en los primeros 3: el
 * resto es un remate ralo, con pausas de más de medio segundo donde nada se
 * mueve, y el personaje volviendo despacio a su pose inicial. En la
 * previsualización de la herramienta no se nota porque ahí loopea y la cola
 * enlaza con el principio; suelta, se ve como si la animación se trabara y se
 * desarmara.
 *
 * Recortar aquí y no en el archivo deja el original intacto: si mañana se
 * reexporta más corta, se borra esta entrada y nada más cambia.
 */
const RANGOS: Partial<Record<SapoState, [number, number]>> = {
  happy: [0, 192],
  celebrating: [0, 192],
};

export function rangoDe(estado: SapoState): [number, number] | null {
  return RANGOS[estado] ?? null;
}

export function animacionDe(estado: SapoState): unknown {
  return ANIMACIONES[estado] ?? idle;
}

export function esEnBucle(estado: SapoState): boolean {
  return EN_BUCLE.includes(estado);
}
