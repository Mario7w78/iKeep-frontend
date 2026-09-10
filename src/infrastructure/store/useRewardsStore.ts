import { create } from 'zustand';

import {
  PendientePasado,
  ProgresoDelDia,
  Racha,
  RespuestaDeCierre,
  ResumenDeLogros,
  cerrarDia,
  completarActividad,
  descompletarActividad,
  fechaLocal,
  obtenerEquilibrio,
  obtenerResumen,
} from '../api/RewardsApiService';
import { notificationScheduler } from '../../di/Dependencies';
import { sincronizarAvisos } from '../../application/use-cases/SyncReengagementReminders';
import { Flor, construirFlor } from '../../domain/services/lifeBalance';

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
  noHechasIds: [],
};

interface RewardsState {
  racha: Racha;
  /** Los pétalos. `null` mientras no se haya pedido. */
  flor: Flor | null;
  progreso: ProgresoDelDia;
  /** Días con algo hecho, para el historial. */
  diasCompletados: string[];
  /**
   * Lo que quedó sin decir en los días anteriores (dentro de la gracia).
   * Lo muestra el carry-over al abrir la app; la tarjeta siempre pregunta
   * antes de actuar.
   */
  pendientesPasados: PendientePasado[];
  cargando: boolean;
  /** Sube cada vez que se termina el día. Lo escucha la celebración. */
  diasTerminados: number;
  cargar: (fecha?: string) => Promise<void>;
  alternar: (activityId: string, fecha?: string) => Promise<void>;
  estaCompletada: (activityId: string) => boolean;
  /** Resuelve de una vez lo que quedó sin decir. Ver `cerrarDia`. */
  cerrar: (respuesta: RespuestaDeCierre, hechas?: string[], fecha?: string) => Promise<void>;
  /**
   * Marca un pendiente de un día anterior (hecha o no hecha) y refresca.
   * Es la acción del carry-over: el usuario elige, la app cumple. Nunca se
   * dispara sola.
   */
  marcarPasado: (activityId: string, fecha: string, hecha: boolean) => Promise<void>;
  /** Trae el equilibrio. Aparte de `cargar`: solo lo mira una pantalla. */
  cargarFlor: (fecha?: string) => Promise<void>;
}

export const useRewardsStore = create<RewardsState>()((set, get) => ({
  racha: RACHA_VACIA,
  flor: null,
  progreso: PROGRESO_VACIO,
  diasCompletados: [],
  pendientesPasados: [],
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
      set({
        racha: resumen.racha,
        progreso: resumen.progreso,
        diasCompletados: resumen.diasCompletados,
        pendientesPasados: resumen.pendientesPasados,
      });

      // Los avisos se resincronizan con cada lectura: es el unico momento en
      // que sabemos si la racha sigue viva y si al dia le queda algo. Se
      // reconcilia, asi que una racha rota deja de avisar sola.
      sincronizarAvisos(notificationScheduler, {
        rachaActual: resumen.racha.actual,
        diaTerminado: resumen.progreso.terminado,
        actividadesHoy: resumen.progreso.total,
      }).catch(() => undefined);
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

  marcarPasado: async (activityId, fecha, hecha) => {
    try {
      if (hecha) {
        await completarActividad(activityId, fecha, 'hecha', 'manual');
      } else {
        await completarActividad(activityId, fecha, 'no_hecha', 'manual');
      }
      // Refresca para que el pendiente salga del carry-over.
      await get().cargar(fechaLocal());
    } catch (error) {
      console.error('No se pudo marcar un pendiente del día anterior:', error);
    }
  },

  /**
   * El equilibrio entre áreas.
   *
   * No viaja con `cargar` aunque salga del mismo servidor: la racha la mira
   * el Home en cada apertura y esto solo la pantalla de progreso. Pegarlos
   * haría que todos paguen una consulta que casi nadie usa.
   */
  cargarFlor: async (fecha = fechaLocal()) => {
    try {
      const { historico, recientes } = await obtenerEquilibrio(fecha);
      set({ flor: construirFlor(historico, recientes) });
    } catch (error) {
      // Como la racha: es un adorno sobre lo que el usuario vino a ver, y
      // que falle no puede tapar el resto de la pantalla.
      console.warn('El equilibrio no cargó todavía:', error);
    }
  },

  /**
   * El cierre del día.
   *
   * No es optimista, a diferencia de `alternar`: acá el usuario acaba de
   * responder una pregunta sobre el día entero y el resultado que importa es
   * el del servidor. Adivinarlo y corregirlo después sería peor que esperar.
   */
  cerrar: async (respuesta, hechas = [], fecha = fechaLocal()) => {
    const anterior = get().progreso;
    set({ cargando: true });
    try {
      const progreso = await cerrarDia(respuesta, hechas, fecha);
      set({ progreso });

      // "Fue un día difícil" no celebra nada, aunque el progreso quede en
      // cero de cero: festejar ahí sería no haber escuchado la respuesta.
      if (progreso.terminado && !anterior.terminado && respuesta !== 'dificil') {
        set({ diasTerminados: get().diasTerminados + 1 });
      }

      await get().cargar(fecha);
    } catch (error) {
      console.error('No se pudo cerrar el día:', error);
      set({ progreso: anterior });
      throw error;
    } finally {
      set({ cargando: false });
    }
  },
}));
