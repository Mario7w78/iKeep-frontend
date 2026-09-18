import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { conReintentos } from '../api/backendClient';
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

/**
 * Número de la última carga pedida.
 *
 * Marcar es optimista y después refresca contra el servidor. Con dos marcas
 * seguidas salen dos `obtenerResumen` en paralelo, y el que resuelve último
 * pisa el estado aunque su foto sea más vieja: marcar dos actividades y ver
 * una sola. Cada carga se queda con su número y solo aplica si sigue siendo la
 * última; además, marcar algo invalida lo que esté en vuelo.
 */
let secuenciaCarga = 0;

const RACHA_VACIA: Racha = { actual: 0, mejor: 0, enRiesgo: false };

/**
 * Lo último que se supo de la racha mientras vivía, guardado en el teléfono.
 * Sin esto solo se podría avisar la rotura dentro de la misma sesión: cerrar
 * la app con una racha de 5 y volver a los 3 días con 0 quedaría silencioso.
 * Se dispara solo al romperse (actual > 0 → 0), no por bajar a medias.
 */
const CLAVE_ULTIMA_RACHA = '@ultima_racha_actual';

async function leerUltimaRacha(): Promise<number> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE_ULTIMA_RACHA);
    const valor = texto ? Number(texto) : 0;
    return Number.isFinite(valor) ? valor : 0;
  } catch {
    // Estado de adorno: que la lectura falle no debe tapar la racha.
    return 0;
  }
}

async function guardarUltimaRacha(actual: number): Promise<void> {
  try {
    if (actual > 0) {
      await AsyncStorage.setItem(CLAVE_ULTIMA_RACHA, String(actual));
    } else {
      await AsyncStorage.removeItem(CLAVE_ULTIMA_RACHA);
    }
  } catch {
    // Igual que arriba: lo que se guarda es solo un recordatorio.
  }
}
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
  /**
   * Si ya se trajo el resumen del dia al menos una vez.
   *
   * Antes de esto `completadas` y `noHechas` estan vacias, y "vacio" se lee
   * como "todavia no respondio nada": el cierre del dia se ofrecia por un
   * instante al abrir la app y se iba cuando llegaba el resumen. Quien dibuja
   * preguntas tiene que esperar a este dato.
   */
  hidratado: boolean;
  /** Sube cada vez que se termina el día. Lo escucha la celebración. */
  diasTerminados: number;
  /**
   * True si la racha se apagó desde la última carga (o desde que se cerró
   * la app): momento en que se pasa de actual > 0 a 0. Lo muestra el Home
   * una vez, hasta que se descarta.
   */
  rachaRota: boolean;
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
  /** Reconoce el aviso de racha apagada. Se usa una vez, no para siempre. */
  descartarRachaRota: () => void;
}

export const useRewardsStore = create<RewardsState>()((set, get) => ({
  racha: RACHA_VACIA,
  flor: null,
  progreso: PROGRESO_VACIO,
  diasCompletados: [],
  pendientesPasados: [],
  cargando: false,
  hidratado: false,
  diasTerminados: 0,
  rachaRota: false,

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
    const peticion = ++secuenciaCarga;
    set({ cargando: true });
    try {
      // Reintenta solo fallos pasajeros (502/503/504, red), y deja de
      // intentar cuando otra carga más nueva tomó el mando.
      const resumen = await conReintentos(() => obtenerResumen(fecha), {
        debeSeguir: () => peticion === secuenciaCarga,
      });

      // Una carga más nueva (o una marca optimista) ya tomó el mando: aplicar
      // esta foto vieja borraría lo que el usuario acaba de marcar.
      if (peticion !== secuenciaCarga) return;

      // La rotura se detecta contra lo último que se supo, guardado en el
      // teléfono: cubre la caída entre sesiones sin pedirle memoria al usuario.
      const ultimaRacha = await leerUltimaRacha();
      const seApago = ultimaRacha > 0 && resumen.racha.actual === 0;
      await guardarUltimaRacha(resumen.racha.actual);

      set({
        racha: resumen.racha,
        progreso: resumen.progreso,
        diasCompletados: resumen.diasCompletados,
        pendientesPasados: resumen.pendientesPasados,
        hidratado: true,
        rachaRota: seApago || get().rachaRota,
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
      // Solo la última carga apaga el indicador: una descartada lo dejaría en
      // falso mientras la vigente sigue en vuelo.
      if (peticion === secuenciaCarga) set({ cargando: false });
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

    // Lo que estuviera en vuelo quedó viejo: ya no incluye esta marca. Se
    // invalida acá, antes de esperar la red, para que una carga lenta no
    // borre el check optimista mientras seguimos esperando.
    secuenciaCarga += 1;

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

  descartarRachaRota: () => set({ rachaRota: false }),

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
