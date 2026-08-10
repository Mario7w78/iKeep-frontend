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

export function animacionDe(estado: SapoState): unknown {
  return ANIMACIONES[estado] ?? idle;
}

export function esEnBucle(estado: SapoState): boolean {
  return EN_BUCLE.includes(estado);
}
