import { create } from 'zustand';

import {
  EventoImportado,
  VentanaGoogle,
  cargarEventos,
  consultarEstado,
  desconectar as desconectarEnServidor,
} from '../api/GoogleCalendarApiService';
import { BackendError } from '../api/backendClient';
import { aFechaLocal } from '../api/CalendarApiService';

/**
 * El recuerdo de Google, aparte.
 *
 * Es un store PROPOSITIVAMENTE separado de useCalendarStore (D7): si Google
 * falla —sin red, cuota vencida, token revocado— el calendario propio sigue
 * intacto. Compartir estados de carga y error seria dejar que un adorno
 * tumbe la pantalla entera.
 */

/** La vida del vinculo con Google, tal como la lee la UI. */
export type EstadoGoogle = 'desconectado' | 'conectado' | 'reconexion';

interface GoogleCalendarState {
  /** El estado de la conexion que pinta Settings y decide si se sincroniza. */
  estado: EstadoGoogle;
  /** Clave `YYYY-MM-DD` -> eventos importados que caen ese dia. */
  porDia: Record<string, EventoImportado[]>;
  cargando: boolean;
  /** Error propio de esta seccion; nunca cruza al calendario principal. */
  error: string | null;

  /**
   * Cuántos eventos importados dejó la última sincronización exitosa.
   *
   * Cero es un resultado válido ("tu mes está vacío"), null es "todavía no
   * sincronizamos". Es lo que el banner de Settings muestra para que conectar
   * Google no parezca un botón que no hizo nada (item 4).
   */
  ultimoConteo: number | null;

  /**
   * Ya preguntamos /estado en esta sesion.
   *
   * Sin esto, cada navegacion de mes re-preguntaria por siempre jamas: el
   * flag permite confiar en lo que ya sabemos (sobre todo tras desconectar,
   * donde el contrato exige CERO llamadas google).
   * Interno: no es estado de UI.
   */
  verificado: boolean;

  /**
   * Última carga exitosa por rango (`desde|hasta` → timestamp ms).
   *
   * Evita que cada foco de la vista de calendario vuelva a golpear la red por
   * un rango que ya tenemos. Si lo pedimos hace menos de 30 s se reutiliza.
   * Se limpia al cambiar de usuario (reiniciarSesion).
   */
  ultimaCargaPorRango: Record<string, number>;

  /** Pregunta al backend si hay tokens vigentes. Devuelve el estado final. */
  verificarEstado: () => Promise<EstadoGoogle>;
  /**
   * Sincroniza y guarda los eventos del rango. Silencioso por diseño:
   * resuelve siempre y deja el resultado en `error`, para que nadie del
   * flujo del calendario principal tenga que aguantar una excepcion ajena.
   */
  cargar: (desde: string, hasta: string, forzar?: boolean) => Promise<void>;
  /** Confirma la conexion tras volver del navegador de consentimiento. */
  confirmarConexion: () => Promise<boolean>;
  /** Corta el vinculo y borra TODO lo importado, sin dejar rastro local. */
  desconectar: () => Promise<void>;
  /** Vacía el recuerdo de la sesión previa (logout o cambio de usuario). */
  reiniciarSesion: () => void;
}

/**
 * Expande la respuesta a filas por dia.
 *
 * El servidor ya recorto los multi-dia (`diasPorEvento`), pero un evento sin
 * entrada en el mapa —defensiva ante contratos viejos— cae en su dia de
 * inicio en vez de desaparecer.
 */
function agrupar(ventana: VentanaGoogle): Record<string, EventoImportado[]> {
  const porId = new Map(ventana.eventos.map((e) => [e.id, e]));
  const salida: Record<string, EventoImportado[]> = {};

  for (const [id, fechas] of Object.entries(ventana.diasPorEvento)) {
    const evento = porId.get(id);
    if (!evento) continue;
    for (const fecha of fechas) {
      (salida[fecha] ??= []).push(evento);
    }
  }

  for (const evento of ventana.eventos) {
    if (ventana.diasPorEvento[evento.id]?.length) continue;
    (salida[aFechaLocal(new Date(evento.inicio))] ??= []).push(evento);
  }

  return salida;
}

export const useGoogleCalendarStore = create<GoogleCalendarState>()((set, get) => ({
  estado: 'desconectado',
  porDia: {},
  cargando: false,
  error: null,
  ultimoConteo: null,
  verificado: false,
  ultimaCargaPorRango: {},

  verificarEstado: async () => {
    try {
      const conectado = await consultarEstado();
      set({ estado: conectado ? 'conectado' : 'desconectado', verificado: true });
    } catch {
      // No sabemos mejor de lo que sabiamos: conservar el estado actual y no
      // asustar a nadie. El proximo intento volvera a preguntar.
      set({ verificado: true });
    }
    return get().estado;
  },

  cargar: async (desde, hasta, forzar = false) => {
    const clave = `${desde}|${hasta}`;
    if (!forzar && Date.now() - (get().ultimaCargaPorRango[clave] ?? 0) < 30_000) return;

    // Desconectado conocido: ni un byte sale hacia google (spec
    // external-events-ui). Solo la primera vez se pregunta de verdad.
    if (!get().verificado) await get().verificarEstado();
    if (get().estado !== 'conectado') return;

    set({ cargando: true, error: null });
    try {
      const ventana = await cargarEventos(desde, hasta);
      // Eventos que tocan el rango, sin paginar por dia: es el tamaño de la
      // sincronización que el banner le va a mostrar al usuario.
      set({
        porDia: agrupar(ventana),
        ultimoConteo: ventana.conectado ? ventana.eventos.length : null,
        ultimaCargaPorRango: { ...get().ultimaCargaPorRango, [clave]: Date.now() },
      });
    } catch (e) {
      if (e instanceof BackendError && e.isAuthError) {
        // Token revocado o vencido para siempre (invalid_grant -> 401):
        // los datos viejos ya no son verdad, fuera, y Settings ofrece reconectar.
        set({ estado: 'reconexion', porDia: {}, ultimoConteo: null });
      } else {
        // Fallo transitorio: lo decimos en la seccion, pero lo ya mostrado
        // se queda — mejor datos viejos que una seccion vacia que miente.
        set({ error: 'No pudimos traer tus eventos de Google.' });
        console.warn('Google Calendar:', e);
      }
    } finally {
      set({ cargando: false });
    }
  },

  confirmarConexion: async () => {
    const estado = await get().verificarEstado();
    return estado === 'conectado';
  },

  desconectar: async () => {
    try {
      await desconectarEnServidor();
    } catch (e) {
      // Si el servidor no se enteró, decir "desconectado" seria mentir:
      // los tokens seguirian vivos alla. El error queda en la seccion.
      set({ error: 'No pudimos desconectar. Vuelve a intentarlo.' });
      console.warn('Google Calendar:', e);
      return;
    }
    set({
      estado: 'desconectado',
      porDia: {},
      error: null,
      cargando: false,
      ultimoConteo: null,
      ultimaCargaPorRango: {},
      // Sigue verificado: acabamos de saber que no hay conexion, y el
      // contrato pide cero llamadas google tras desconectar.
      verificado: true,
    });
  },

  reiniciarSesion: () => {
    set({ porDia: {}, ultimaCargaPorRango: {} });
  },
}));
