/**
 * De qué parte de tu vida es una actividad — los pétalos del loto.
 *
 * Reemplaza a `identity` (Clase / Trabajo / Tarea), que hacía tres trabajos y
 * ninguno bien: era el ícono, el color, y de paso decidía si el solver podía
 * mover la actividad. Ese último uso causaba un bug real —un turno de 9 a 5
 * se reubicaba solo, por no llamarse "clase"— y además obligaba al usuario a
 * hacer una distinción que no significa nada: clase y trabajo ocupan el
 * horario exactamente igual.
 *
 * Son dos preguntas independientes:
 *
 *   comportamiento → ¿cuándo ocurre?          (horaFija · diaFijo · flexible)
 *   area           → ¿de qué parte de tu vida? (esto)
 *
 * Cinco áreas, y ese es el techo. Un loto de doce pétalos no se lee a 72 px y
 * cada área nueva diluye a las demás; si hiciera falta otra, hay que quitar
 * una.
 *
 * Los íconos son provisionales —Ionicons— hasta que existan las
 * ilustraciones.
 */

export type AreaDeVida = 'estudio' | 'trabajo' | 'cuerpo' | 'vinculos' | 'yo';

export const AREA_POR_DEFECTO: AreaDeVida = 'estudio';

export interface DescripcionDeArea {
  valor: AreaDeVida;
  titulo: string;
  /** Qué cuenta acá. Sin esto, "Tú" no se entiende. */
  ejemplo: string;
  icono: string;
}

export const AREAS: DescripcionDeArea[] = [
  {
    valor: 'estudio',
    titulo: 'Estudio',
    ejemplo: 'Clases, tareas, exámenes',
    icono: 'school-outline',
  },
  {
    valor: 'trabajo',
    titulo: 'Trabajo',
    ejemplo: 'Lo que haces por obligación remunerada',
    icono: 'briefcase-outline',
  },
  {
    valor: 'cuerpo',
    titulo: 'Cuerpo',
    ejemplo: 'Moverte, dormir, comer',
    icono: 'walk-outline',
  },
  {
    valor: 'vinculos',
    titulo: 'Vínculos',
    ejemplo: 'Ver gente, llamar, salir',
    icono: 'people-outline',
  },
  {
    valor: 'yo',
    titulo: 'Tú',
    ejemplo: 'Leer, música, no hacer nada',
    icono: 'leaf-outline',
  },
];

export function esAreaValida(valor: unknown): valor is AreaDeVida {
  return AREAS.some((a) => a.valor === valor);
}

/**
 * Normaliza lo que venga de la base o de una versión anterior.
 *
 * Nunca lanza: un valor desconocido en un campo decorativo no debería
 * impedirle a alguien abrir su lista de actividades.
 */
export function comoArea(valor: unknown): AreaDeVida {
  return esAreaValida(valor) ? valor : AREA_POR_DEFECTO;
}

/**
 * Qué área le corresponde a una actividad creada antes de que el campo
 * existiera.
 *
 * No es una traducción exacta: `identity` no distinguía leer por gusto de
 * estudiar para un examen. Es lo único que el dato viejo permite afirmar, y
 * la persona puede corregirlo desde la app.
 */
export function areaDesdeIdentidad(identidad: string | undefined): AreaDeVida {
  return identidad === 'trabajo' ? 'trabajo' : AREA_POR_DEFECTO;
}
