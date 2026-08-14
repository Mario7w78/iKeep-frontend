import { create } from 'zustand';

import {
  Ocurrencia,
  TipoExcepcion,
  aFechaLocal,
  borrarExcepcion,
  guardarExcepcion,
  verCalendario,
} from '../api/CalendarApiService';

/**
 * El mes que se está mirando.
 *
 * Guarda las ocurrencias ya agrupadas por día: la cuadrícula pinta 35 o 42
 * celdas y buscar en una lista plana en cada una sería recorrerla 42 veces.
 */

interface CalendarState {
  /** Cualquier día del mes visible. El día concreto no importa. */
  mesVisible: Date;
  /** Clave `YYYY-MM-DD` → lo que ocurre ese día. */
  porDia: Record<string, Ocurrencia[]>;
  cargando: boolean;
  error: string | null;

  irAlMes: (delta: number) => Promise<void>;
  cargarMes: (referencia?: Date) => Promise<void>;
  cancelar: (activityId: string, fecha: string) => Promise<void>;
  mover: (activityId: string, fecha: string, nuevaFecha: string) => Promise<void>;
  restaurar: (activityId: string, fecha: string) => Promise<void>;
}

/**
 * El rango que cubre la cuadrícula del mes.
 *
 * No es el mes calendario: la vista muestra los días de relleno del mes
 * anterior y del siguiente para completar las semanas, y esos días también
 * tienen actividades. Pedir solo el mes dejaría los bordes vacíos.
 */
export function rangoDelMes(referencia: Date): { desde: string; hasta: string } {
  const primero = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);

  // La semana arranca el lunes; getDay() usa domingo = 0.
  const desplazamientoInicio = (primero.getDay() + 6) % 7;
  const desplazamientoFin = 6 - ((ultimo.getDay() + 6) % 7);

  const desde = new Date(primero);
  desde.setDate(primero.getDate() - desplazamientoInicio);
  const hasta = new Date(ultimo);
  hasta.setDate(ultimo.getDate() + desplazamientoFin);

  return { desde: aFechaLocal(desde), hasta: aFechaLocal(hasta) };
}

function agrupar(ocurrencias: Ocurrencia[]): Record<string, Ocurrencia[]> {
  const salida: Record<string, Ocurrencia[]> = {};
  for (const o of ocurrencias) {
    (salida[o.fecha] ??= []).push(o);
  }
  return salida;
}

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  mesVisible: new Date(),
  porDia: {},
  cargando: false,
  error: null,

  cargarMes: async (referencia = get().mesVisible) => {
    const { desde, hasta } = rangoDelMes(referencia);
    set({ cargando: true, error: null });
    try {
      set({ porDia: agrupar(await verCalendario(desde, hasta)) });
    } catch (e) {
      // El calendario es la pantalla entera, no un adorno: si falla hay que
      // decirlo y ofrecer reintentar, no dejar una cuadrícula vacía que se
      // lee como "no tienes nada".
      set({ error: 'No pudimos cargar tu calendario. Vuelve a intentarlo.' });
      console.warn('Calendario:', e);
    } finally {
      set({ cargando: false });
    }
  },

  irAlMes: async (delta) => {
    const actual = get().mesVisible;
    const nuevo = new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    // Se limpia antes de pedir: mostrar el mes anterior mientras carga el
    // siguiente hace que el usuario lea fechas que no corresponden.
    set({ mesVisible: nuevo, porDia: {} });
    await get().cargarMes(nuevo);
  },

  cancelar: async (activityId, fecha) => {
    await guardarExcepcion({ activityId, fecha, tipo: 'cancelada' });
    await get().cargarMes();
  },

  mover: async (activityId, fecha, nuevaFecha) => {
    await guardarExcepcion({ activityId, fecha, tipo: 'movida', nuevaFecha });
    await get().cargarMes();
  },

  restaurar: async (activityId, fecha) => {
    await borrarExcepcion(activityId, fecha);
    await get().cargarMes();
  },
}));
