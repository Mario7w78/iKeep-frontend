/**
 * Qué avisos merecen una notificación, y cuáles no.
 *
 * Lo difícil de las notificaciones no es enviarlas: es no enviarlas. Una app
 * que avisa todos los días de lo mismo se silencia en una semana, y una
 * silenciada no avisa nunca más — el permiso se pierde una sola vez.
 *
 * La regla que gobierna todo esto: **solo se avisa cuando hay algo que
 * perder o algo que hacer**. Si no hay racha, no hay racha en riesgo. Si el
 * día ya está completo, no hay nada que recordar.
 *
 * Es lógica pura a propósito. Decidir qué avisar es una decisión de producto
 * y se prueba sin tocar el sistema de notificaciones; programarlas es un
 * detalle del adaptador.
 */

export const AVISO_MATUTINO = 'kerotime-resumen-matutino';
export const AVISO_RACHA = 'kerotime-racha-en-riesgo';

/** Temprano, pero no tanto como para despertar a nadie. */
const HORA_MATUTINA = 8;

/**
 * Con tiempo para reaccionar.
 *
 * A las 22:00 el aviso llega cuando ya no queda día para arreglarlo, y eso no
 * es un recordatorio: es un reproche.
 */
const HORA_RACHA = 19;

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
 */
export function avisosQueCorresponden(estado: EstadoParaAvisos): Aviso[] {
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

  return avisos;
}

/** Los identificadores que este módulo administra. */
export const TODOS_LOS_AVISOS = [AVISO_MATUTINO, AVISO_RACHA];
