/**
 * Qué avisos merecen una notificación, y cuáles no.
 *
 * La regla original era: **solo se avisa cuando hay algo que perder o algo
 * que hacer**. Esa regla rige el matutino y la racha.
 *
 * La excepción a propósito es `AVISO_ANIMO`: es diario (siempre se agenda)
 * y rota un texto distinto por día de semana. Se acepta el ruido de fondo
 * porque el texto es positivo, breve, y el usuario lo pidió.
 *
 * Decidir qué avisar es una decisión de producto y se prueba sin tocar el
 * sistema de notificaciones; programarlas es un detalle del adaptador.
 */

export const AVISO_MATUTINO = 'kerotime-resumen-matutino';
export const AVISO_RACHA = 'kerotime-racha-en-riesgo';
export const AVISO_ANIMO = 'kerotime-animo';

/** Temprano, pero no tanto como para despertar a nadie. */
const HORA_MATUTINA = 8;

/**
 * Con tiempo para reaccionar.
 *
 * A las 22:00 el aviso llega cuando ya no queda día para arreglarlo, y eso no
 * es un recordatorio: es un reproche.
 */
const HORA_RACHA = 19;

/** Cierre del día, después del aviso de racha. */
const HORA_ANIMO = 20;

/**
 * Pool de frases para el aviso de ánimo. La frase se elige por día de la
 * semana (`hoy.getDay() % n`), lo que garantiza variedad diaria sin random.
 * Se exporta para que los tests puedan verificar que una semana recorrida
 * produce 7 textos distintos.
 */
export const FRASES_ANIMO: readonly string[] = [
  'Cada día que organizas es uno que no tenías antes.',
  'Pusiste tiempo en algo que importa.',
  'No todo se mide por lo que faltó.',
  'El esfuerzo de hoy construye el de mañana.',
  'Incluso un día tranquilo cuenta.',
  'Lo que lograste hoy ya está hecho.',
  'Organizar tu tiempo es en sí un acto de cuidado.',
] as const;

export interface Aviso {
  identifier: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

export interface EstadoParaAvisos {
  rachaActual: number;
  /** Ya se completó todo lo de hoy. */
  diaTerminado: boolean;
  /** Cuántas actividades tocan hoy. Cero significa día libre. */
  actividadesHoy: number;
}

/**
 * Los avisos que deberían existir con este estado.
 *
 * Lo que no está en la lista se cancela. Devolver el conjunto completo en vez
 * de una serie de altas y bajas hace que el estado del sistema sea siempre
 * deducible de acá, sin memoria de lo que se programó antes.
 *
 * @param hoy Para testeo inyectable. En producción se usa `new Date()`.
 */
export function avisosQueCorresponden(
  estado: EstadoParaAvisos,
  hoy: Date = new Date(),
): Aviso[] {
  const avisos: Aviso[] = [];

  // Sin nada agendado no hay resumen que dar. Un "buenos días" a secas es
  // ruido, y el ruido es lo que hace que la gente apague los avisos.
  if (estado.actividadesHoy > 0) {
    avisos.push({
      identifier: AVISO_MATUTINO,
      title: 'Tu día ya está armado',
      body:
        estado.actividadesHoy === 1
          ? 'Hoy tienes una actividad. Échale un vistazo.'
          : `Hoy tienes ${estado.actividadesHoy} actividades. Échales un vistazo.`,
      hour: HORA_MATUTINA,
      minute: 0,
    });
  }

  // Solo hay racha en riesgo si hay racha. Avisarle de una racha perdida a
  // quien no tenía ninguna es inventarle una culpa.
  if (estado.rachaActual > 0 && !estado.diaTerminado) {
    avisos.push({
      identifier: AVISO_RACHA,
      title: `Llevas ${estado.rachaActual} ${estado.rachaActual === 1 ? 'día' : 'días'} seguidos`,
      // Nada de "vas a perder tu racha": el objetivo es que vuelva, no que se
      // sienta mal. Se nombra lo que puede hacer, no lo que puede perder.
      body: 'Todavía estás a tiempo de marcar algo hoy.',
      hour: HORA_RACHA,
      minute: 0,
    });
  }

  // Ánimo diario: siempre se agenda, con texto rotado por día de semana.
  // Excepción deliberada a la regla del ruido (decisión del usuario).
  avisos.push({
    identifier: AVISO_ANIMO,
    title: 'Un recordatorio para ti',
    body: FRASES_ANIMO[hoy.getDay() % FRASES_ANIMO.length],
    hour: HORA_ANIMO,
    minute: 0,
  });

  return avisos;
}

/** Los identificadores que este módulo administra. */
export const TODOS_LOS_AVISOS = [AVISO_MATUTINO, AVISO_RACHA, AVISO_ANIMO];
