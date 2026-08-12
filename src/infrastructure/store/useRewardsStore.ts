import { create } from 'zustand';

import {
  ProgresoDelDia,
  Racha,
  ResumenDeLogros,
  completarActividad,
  descompletarActividad,
  fechaLocal,
  obtenerResumen,
} from '../api/RewardsApiService';

/**
 * El ciclo de recompensa.
 *
 * Sin poder marcar algo como hecho, la app es una agenda: muestra lo que
 * viene y nunca reconoce lo que pasó. Duolingo funciona porque existe el
 * momento en que terminas la lección — este store es ese momento.
 */

const RACHA_VACIA: Racha = { actual: 0, mejor: 0, enRiesgo: false };
const PROGRESO_VACIO: ProgresoDelDia = {
  completadas: 0,
  total: 0,
  fraccion: 1,
  terminado: false,
  completadosIds: [],
};

interface RewardsState {
  racha: Racha;
  progreso: ProgresoDelDia;
  cargando: boolean;
  /** Sube cada vez que se termina el día. Lo escucha la celebración. */
  diasTerminados: number;
  cargar: (fecha?: string) => Promise<void>;
  alternar: (activityId: string, fecha?: string) => Promise<void>;
  estaCompletada: (activityId: string) => boolean;
}

export const useRewardsStore = create<RewardsState>()((set, get) => ({
  racha: RACHA_VACIA,
  progreso: PROGRESO_VACIO,
  cargando: false,
  diasTerminados: 0,

  /**
   * Trae racha y progreso.
   *
   * Reintenta una vez si el primer intento se agota. Este suele ser el primer
   * pedido del día contra un servidor dormido, y ese pedido es justamente el
   * que lo despierta: para el segundo ya está en pie. Con red lenta, el
   * primero se agota aunque el servidor esté vivo, así que un reintento cubre
   * los dos casos y el cron no.
   */
  cargar: async (fecha = fechaLocal()) => {
    set({ cargando: true });
    try {
      let resumen: ResumenDeLogros;
      try {
        resumen = await obtenerResumen(fecha);
      } catch {
        resumen = await obtenerResumen(fecha);
      }
      set({ racha: resumen.racha, progreso: resumen.progreso });
    } catch (error) {
      // Que falle no puede tapar el horario ni asustar: la racha es un adorno
      // sobre lo que el usuario vino a ver. Se avisa como aviso, no como
      // error, porque no hay nada que el usuario deba hacer.
      console.warn('La racha no cargó todavía:', error);
    } finally {
      set({ cargando: false });
    }
  },

  /**
   * Marca o desmarca, y actualiza la pantalla antes de que el servidor
   * conteste.
   *
   * Optimista a propósito: tocar una casilla y esperar a que un servidor
   * dormido despierte rompe la sensación de que la app responde, que es
   * justamente lo que este ciclo viene a construir. Si falla, se revierte.
   */
  alternar: async (activityId, fecha = fechaLocal()) => {
    const anterior = get().progreso;
    const estaba = anterior.completadosIds.includes(activityId);

    const ids = estaba
      ? anterior.completadosIds.filter((id) => id !== activityId)
      : [...anterior.completadosIds, activityId];

    const optimista: ProgresoDelDia = {
      ...anterior,
      completadas: ids.length,
      completadosIds: ids,
      fraccion: anterior.total === 0 ? 1 : Math.min(ids.length / anterior.total, 1),
      terminado: anterior.total > 0 && ids.length >= anterior.total,
    };
    set({ progreso: optimista });

    // Solo cuenta al pasar de incompleto a completo: sin esto, desmarcar y
    // volver a marcar dispararía la celebración cada vez.
    if (optimista.terminado && !anterior.terminado) {
      set({ diasTerminados: get().diasTerminados + 1 });
    }

    try {
      if (estaba) {
        await descompletarActividad(activityId, fecha);
      } else {
        await completarActividad(activityId, fecha);
      }
      // La racha la calcula el servidor: adivinarla acá sería una segunda
      // implementación de las reglas de borde.
      await get().cargar(fecha);
    } catch (error) {
      console.error('No se pudo guardar el completado:', error);
      set({ progreso: anterior });
    }
  },

  estaCompletada: (activityId) => get().progreso.completadosIds.includes(activityId),
}));
