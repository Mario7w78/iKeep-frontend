import { DayLimitPersistence } from '../store/useScheduleStore';
import { backendRequest } from '../api/backendClient';

/**
 * Ajustes de planificacion a traves del backend.
 *
 * El puerto expone un getter y un setter por campo, heredado de cuando esto
 * era AsyncStorage. Se conserva la forma para no tocar el store, pero cada
 * lectura trae la fila entera: son siete campos en un solo objeto, y pedirlos
 * de a uno serian siete viajes para lo mismo.
 */

const RUTA = '/api/v1/ajustes';

interface SettingsDto {
  user_id: string;
  start_hour: number;
  end_hour: number;
  dia_inicio: number;
  dias_totales: number;
  per_day_start_hours: number[] | null;
  per_day_end_hours: number[] | null;
  custom_energy_pattern: string | null;
}

async function leer(): Promise<SettingsDto> {
  return backendRequest<SettingsDto>(RUTA);
}

async function aplicar(cambios: Partial<SettingsDto>): Promise<void> {
  // PATCH y no PUT: mandar solo lo que cambia evita que fijar una hora pise
  // el resto de los ajustes.
  await backendRequest<SettingsDto>(RUTA, { method: 'PATCH', body: cambios });
}

export const apiDayLimitPersistence: DayLimitPersistence = {
  getStartHour: async () => (await leer()).start_hour,
  getEndHour: async () => (await leer()).end_hour,
  setStartHour: (hour) => aplicar({ start_hour: hour }),
  setEndHour: (hour) => aplicar({ end_hour: hour }),

  getDiaInicio: async () => (await leer()).dia_inicio,
  getDiasTotales: async () => (await leer()).dias_totales,
  setDiaInicio: (val) => aplicar({ dia_inicio: val }),
  setDiasTotales: (val) => aplicar({ dias_totales: val }),

  getPerDayStartHours: async () => (await leer()).per_day_start_hours,
  setPerDayStartHours: (val) => aplicar({ per_day_start_hours: val }),
  getPerDayEndHours: async () => (await leer()).per_day_end_hours,
  setPerDayEndHours: (val) => aplicar({ per_day_end_hours: val }),
};
