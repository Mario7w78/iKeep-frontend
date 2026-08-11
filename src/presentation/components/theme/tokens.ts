/**
 * Las medidas de la app.
 *
 * Hoy no existe ninguna: hay 95 colores hex sueltos fuera del tema, 59
 * `rgba()` literales y cero tokens de espaciado, radio o tipografía. Cada
 * pantalla eligió sus números por su cuenta, así que dos tarjetas que
 * deberían verse iguales tienen 12 y 14 de padding sin que nadie lo haya
 * decidido.
 *
 * La escala no es arbitraria: múltiplos de 4 desde 4 hasta 32. Con una escala
 * cerrada, "un poco más de aire" tiene una única respuesta posible, y es la
 * misma para todos.
 *
 * No reemplaza a `colors`. Los colores dependen del tema y cambian con él;
 * esto no cambia nunca, y por eso puede ser una constante.
 */

/** Espaciado: márgenes, padding y separaciones. */
export const ESPACIO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Radios de esquina.
 *
 * `pill` es deliberadamente enorme: un número grande redondea a cápsula sin
 * tener que saber la altura del elemento.
 */
export const RADIO = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Tamaños de texto.
 *
 * Los nombres dicen el papel, no el número: `cuerpo` sigue siendo el cuerpo
 * aunque mañana mida 16 en vez de 15.
 */
export const TEXTO = {
  micro: 11,
  pie: 13,
  cuerpo: 15,
  destacado: 17,
  titulo: 20,
  display: 24,
} as const;

/**
 * Pesos tipográficos.
 *
 * La app usa `800` y `900` en todos lados. Se conservan, pero con nombre:
 * `fuerte` explica la intención, `'900'` solo explica el peso.
 */
export const PESO = {
  normal: '500',
  medio: '600',
  fuerte: '800',
  maximo: '900',
} as const;

/**
 * Duraciones de animación, en milisegundos.
 *
 * `instantaneo` es lo que responde a un toque: por encima de unos 150 ms el
 * usuario percibe retardo en vez de respuesta.
 */
export const DURACION = {
  instantaneo: 120,
  rapido: 220,
  normal: 320,
  lento: 420,
} as const;

export type Espacio = keyof typeof ESPACIO;
export type Radio = keyof typeof RADIO;
export type Texto = keyof typeof TEXTO;
