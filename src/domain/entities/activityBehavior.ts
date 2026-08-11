/**
 * Cómo se ubica una actividad en el horario.
 *
 * Es la única pregunta de comportamiento que se le hace al usuario. Antes
 * había dos taxonomías conviviendo —"Identidad" (Clase/Trabajo/Tarea) y
 * "Tipo" (Fijo/Optimizable)— acopladas por efectos secundarios ocultos:
 * elegir "Clase" ponía la actividad en fija y de paso pisaba la prioridad y
 * la dificultad que el usuario ya había elegido, sin avisar y escondiendo la
 * sección donde las había elegido.
 *
 * La identidad pasa a ser solo una etiqueta —ícono y color— y esto es lo
 * único que decide dónde va la actividad.
 *
 * Internamente sigue viajando como dos banderas porque así lo espera el
 * solver, pero el usuario ve una sola decisión con tres opciones.
 */

export type ComportamientoActividad = 'horaFija' | 'diaFijo' | 'flexible';

interface Banderas {
  isFixed: boolean;
  isAnchor: boolean;
}

/**
 * Cómo se le presenta cada opción.
 *
 * El texto está en primera persona y sin vocabulario interno: "Optimizable" y
 * "Anclaje de día" no significan nada para quien recién abre la app. El
 * ejemplo debajo hace el resto del trabajo.
 */
export const OPCIONES_COMPORTAMIENTO: {
  valor: ComportamientoActividad;
  titulo: string;
  ejemplo: string;
  icono: string;
}[] = [
  {
    valor: 'horaFija',
    titulo: 'Siempre a la misma hora',
    ejemplo: 'Tu clase de Cálculo, los martes de 10 a 12',
    icono: 'lock-closed-outline',
  },
  {
    valor: 'diaFijo',
    titulo: 'Yo elijo el día, tú la hora',
    ejemplo: 'Ir al gimnasio los lunes, cuando mejor entre',
    icono: 'calendar-outline',
  },
  {
    valor: 'flexible',
    titulo: 'Cuando mejor encaje',
    ejemplo: 'Estudiar dos horas, el día que haya lugar',
    icono: 'shuffle-outline',
  },
];

export function aBanderas(comportamiento: ComportamientoActividad): Banderas {
  switch (comportamiento) {
    case 'horaFija':
      return { isFixed: true, isAnchor: false };
    case 'diaFijo':
      // El día lo pone el usuario y la hora la resuelve el solver, así que no
      // es fija: el ancla es justamente lo que la distingue de una flexible.
      return { isFixed: false, isAnchor: true };
    case 'flexible':
      return { isFixed: false, isAnchor: false };
  }
}

/**
 * Al reabrir una actividad guardada hay que volver de las banderas a la
 * opción, para que el formulario muestre seleccionado lo que el usuario había
 * elegido y no un valor por defecto.
 */
export function desdeBanderas(isFixed: boolean, isAnchor: boolean): ComportamientoActividad {
  // Una actividad a hora fija no puede además delegar el horario. Si ambas
  // banderas llegan en true —un dato viejo o un error de otro lado— gana la
  // hora fija, que es la más específica.
  if (isFixed) return 'horaFija';
  if (isAnchor) return 'diaFijo';
  return 'flexible';
}
