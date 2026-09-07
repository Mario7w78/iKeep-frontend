import { create, StoreApi, UseBoundStore } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule, ScheduleProps } from '../../domain/entities/Schedule';
import { Activity, DayOfWeek } from '../../domain/entities/Activity';
import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { schedulePersistence } from '../persistence/SchedulePersistenceAdapters';
import { restoreDaysConfig } from '../repositories/SupabaseActivityRepository';
import { GenerateSchedulePort, GenerateScheduleOptions } from '../../application/ports/in/GenerateSchedulePort';
import { ReschedulePort } from '../../application/ports/in/ReschedulePort';
import { SuggestTaskPort } from '../../application/ports/in/SuggestTaskPort';
import { SugerenciaTareaDto } from '../api/dto/SuggestTaskDto';
import { RescheduleRequestDto } from '../api/dto/RescheduleRequestDto';
import { ScheduleResponseDto, ScheduleEstado } from '../api/dto/ScheduleResponseDto';
import { scheduleToBloqueTiempo } from '../api/mappers/rescheduleMapper';
import { EnergyRecord, getEnergyHistory, getEnergyPatternOverride, saveEnergyPatternOverride } from '../persistence/EnergyHistoryService';
import { NotificationScheduler } from '../../application/ports/out/NotificationScheduler';
import { syncActivityNotifications } from '../notifications/ActivityNotificationSync';

interface DayLimitPersistence {
  getStartHour: () => Promise<number>;
  getEndHour: () => Promise<number>;
  setStartHour: (hour: number) => Promise<void>;
  setEndHour: (hour: number) => Promise<void>;
  getDiaInicio: () => Promise<number>;
  getDiasTotales: () => Promise<number>;
  setDiaInicio: (val: number) => Promise<void>;
  setDiasTotales: (val: number) => Promise<void>;
  getPerDayStartHours: () => Promise<number[] | null>;
  setPerDayStartHours: (val: number[] | null) => Promise<void>;
  getPerDayEndHours: () => Promise<number[] | null>;
  setPerDayEndHours: (val: number[] | null) => Promise<void>;
}

export type CalendarViewMode = 'grid' | 'list' | 'mes' | 'anual';

const CALENDAR_VIEW_MODE_KEY = '@calendar_view_mode';

interface ScheduleStoreState {
  schedule: Schedule | null;
  isLoading: boolean;
  isLoadedFromStorage: boolean;
  selectedDay: DayOfWeek;
  /**
   * La vista del calendario (dia/semana, lista, mes, anual). Vive en el store,
   * no en el estado local de la pantalla, para que aterrice donde el usuario
   * la dejo la ultima vez en lugar de siempre en la semana.
   */
  calendarViewMode: CalendarViewMode;
  startHour: number;
  endHour: number;
  activitiesForDay: () => ReturnType<Schedule['getItemsByDay']>;
  handleGenerateSchedule: (energyData?: { nivel_energia: number; historial_energia: EnergyRecord[] }, showSuccessAlert?: boolean) => Promise<void>;
  loadDayLimits: () => Promise<void>;
  loadSchedule: () => Promise<void>;
  /** Deja en memoria un horario que el servidor ya persistio. */
  hidratarHorario: (crudo: any) => void;
  setSelectedDay: (day: DayOfWeek) => void;
  setCalendarViewMode: (mode: CalendarViewMode) => void;
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
  suggestions: SugerenciaTareaDto[];
  handleReschedule: (affectedActivityId: string, lostMinutes: number) => Promise<void>;
  handleSuggestTask: (freeMinutes: number) => Promise<SugerenciaTareaDto[]>;
  rollingWeekStartDay: number;
  rollingWeekTotalDays: number;
  customEnergyPattern: string | null;
  perDayStartHours: number[] | null;
  perDayEndHours: number[] | null;
  setRollingWeekStartDay: (day: number) => Promise<void>;
  setRollingWeekTotalDays: (days: number) => Promise<void>;
  setCustomEnergyPattern: (pattern: string | null) => Promise<void>;
  setPerDayStartHours: (hours: number[] | null) => Promise<void>;
  setPerDayEndHours: (hours: number[] | null) => Promise<void>;
}

export type ScheduleStore = UseBoundStore<StoreApi<ScheduleStoreState>>;

/**
 * Reconstruye un horario desde su forma serializada.
 *
 * La misma para lo que viene de la base y para lo que devuelve /aplicar: dos
 * copias de esto podrian divergir, y la divergencia se veria como bloques que
 * aparecen en una pantalla y no en la otra.
 */
function construirHorario(crudo: any): Schedule {
  const scheduledActivities = (crudo.scheduled_activities || []).map((item: any) => ({
    activity: item.activity
      ? new Activity({
          id: String(item.activity.id),
          title: item.activity.title,
          type: item.activity.type,
          identity: item.activity.identity,
          priority: item.activity.priority,
          difficulty: item.activity.difficulty,
          deadline: item.activity.deadline,
          daysEnabled: item.activity.daysEnabled,
          // Las horas viajan como texto ISO; el dominio las quiere como Date.
          daysConfig: restoreDaysConfig(item.activity.daysConfig),
          optionalDay: item.activity.optionalDay ?? false,
          dayFrom: item.activity.dayFrom !== undefined ? item.activity.dayFrom : undefined,
          dayTo: item.activity.dayTo !== undefined ? item.activity.dayTo : undefined,
          isAnchor: item.activity.isAnchor ?? false,
        })
      : undefined,
    assignedStartTime: item.assignedStartTime,
    assignedEndTime: item.assignedEndTime,
    day: item.day,
    tipo: item.tipo,
  }));

  return new Schedule({
    // Los identificadores los asigna el servidor. Los fallbacks cubren
    // respuestas que no los traen —el backend no expone el id de la fila—
    // sin dejar que un undefined llegue a la entidad.
    id: crudo.id ?? `schedule-${Date.now()}`,
    userId: crudo.user_id ?? '',
    // Puede faltar en filas viejas; sin fallback quedaria un Invalid Date que
    // se propaga en silencio.
    createdAt: crudo.created_at ? new Date(crudo.created_at) : new Date(),
    estado: crudo.estado ?? undefined,
    mensaje: crudo.mensaje ?? undefined,
    recomendaciones: crudo.recomendaciones ?? [],
    tareasOmitidas: crudo.tareas_omitidas ?? [],
    scheduledActivities,
  });
}

export function createScheduleStore(
  generateScheduleUseCase: GenerateSchedulePort,
  dayLimitPersistence: DayLimitPersistence,
  activityRepository: ActivityRepository,
  rescheduleUseCase?: ReschedulePort,
  suggestTaskUseCase?: SuggestTaskPort,
  notificationScheduler?: NotificationScheduler
): ScheduleStore {
  const syncNotifications = (schedule: Schedule | null): void => {
    if (notificationScheduler) {
      void syncActivityNotifications(schedule, notificationScheduler);
    }
  };
  const saveScheduleToStorage = async (schedule: Schedule | null): Promise<void> => {
    try {
      if (!schedule) {
        await schedulePersistence.clear();
        return;
      }

      // No se envía `id`: la tabla hace upsert por `user_id` (índice único,
      // "el" horario vigente de un usuario) y Postgres es dueño de su propio
      // `id` — el `Schedule.id` del dominio ("schedule-<timestamp>") no es
      // un uuid válido para esa columna.
      const row = {
        estado: schedule.estado ?? null,
        mensaje: schedule.mensaje ?? null,
        recomendaciones: schedule.recomendaciones,
        tareas_omitidas: schedule.tareasOmitidas,
        scheduled_activities: schedule.getAllItems().map(item => ({
          activity: item.activity ? {
            id: String(item.activity.id),
            title: item.activity.title,
            type: item.activity.type,
            identity: item.activity.identity,
            priority: item.activity.priority,
            difficulty: item.activity.difficulty,
            deadline: item.activity.deadline,
            daysEnabled: item.activity.daysEnabled,
            daysConfig: item.activity.daysConfig,
            optionalDay: item.activity.optionalDay,
            dayFrom: item.activity.dayFrom,
            dayTo: item.activity.dayTo,
            isAnchor: item.activity.isAnchor,
          } : null,
          assignedStartTime: item.assignedStartTime,
          assignedEndTime: item.assignedEndTime,
          day: item.day,
          tipo: item.tipo,
        })),
      };
      await schedulePersistence.save(row);
    } catch (e) {
      console.error('Error guardando horario:', e);
    }
  };

  const store = create<ScheduleStoreState>((set, get) => ({
    schedule: null,
    isLoading: false,
    isLoadedFromStorage: false,
    startHour: 0,
    endHour: 1439,
    selectedDay: JS_DAY_TO_DAYOFWEEK[new Date().getDay()],
    calendarViewMode: 'grid',
    suggestions: [],
    rollingWeekStartDay: 0,
    rollingWeekTotalDays: 7,
    customEnergyPattern: null,
    perDayStartHours: null,
    perDayEndHours: null,

    activitiesForDay: () => {
      const { schedule, selectedDay, startHour, perDayStartHours } = get();
      const dayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(selectedDay);
      const displayStart = perDayStartHours?.[dayIndex] ?? startHour;
      return schedule ? schedule.getItemsByDay(selectedDay, displayStart) : [];
    },

    loadDayLimits: async () => {
      try {
        const start = await dayLimitPersistence.getStartHour();
        const end = await dayLimitPersistence.getEndHour();
        const diaInicio = await dayLimitPersistence.getDiaInicio();
        const diasTotales = await dayLimitPersistence.getDiasTotales();
        const perDayStart = await dayLimitPersistence.getPerDayStartHours();
        const perDayEnd = await dayLimitPersistence.getPerDayEndHours();
        const energyPattern = await getEnergyPatternOverride();

        let sH = start !== null ? start : 240;
        let eH = end !== null ? end : 1320;

        if (sH === eH) {
          sH = 240;
          eH = 1320;
        }

        set({
          startHour: sH,
          endHour: eH,
          rollingWeekStartDay: diaInicio ?? 0,
          rollingWeekTotalDays: diasTotales ?? 7,
          perDayStartHours: perDayStart ?? null,
          perDayEndHours: perDayEnd ?? null,
          customEnergyPattern: energyPattern,
        });
      } catch (e) {
        console.error('Error cargando límites del día:', e);
      }
    },

    /**
     * Deja en memoria un horario que el servidor ya guardo.
     *
     * Lo usa el camino de /aplicar: el backend persiste y devuelve el
     * resultado, asi que volver a pedirlo seria un viaje de mas justo en el
     * endpoint que existe para ahorrarlos.
     */
    hidratarHorario: (crudo: any) => {
      const hidratado = construirHorario(crudo);
      set({ schedule: hidratado });
      syncNotifications(hidratado);
    },

    loadSchedule: async () => {
      try {
        const parsed = await schedulePersistence.load();

        if (parsed) {
          const loadedSchedule = construirHorario(parsed);
            // Los identificadores los asigna el servidor. Los fallbacks
            // cubren respuestas que no los traen —el backend no expone el id
            // de la fila— sin dejar que un undefined llegue a la entidad.
          set({ schedule: loadedSchedule });
          syncNotifications(loadedSchedule);
        }
      } catch (e) {
        console.error('Error cargando horario:', e);
      } finally {
        set({ isLoadedFromStorage: true });
      }
    },

    handleGenerateSchedule: async (energyData, showSuccessAlert = false) => {
      const existingActivities = await activityRepository.getAll();
      if (existingActivities.length === 0) {
        set({ schedule: null });
        await saveScheduleToStorage(null);
        syncNotifications(null);
        return;
      }

      const { startHour, endHour, rollingWeekStartDay, rollingWeekTotalDays, customEnergyPattern, perDayStartHours, perDayEndHours } = get();
      set({ isLoading: true });
      try {
        const options: GenerateScheduleOptions = {
          dia_inicio: rollingWeekStartDay,
          dias_totales: rollingWeekTotalDays,
          patron_energia_manual: customEnergyPattern ?? undefined,
          perDayStartHours: perDayStartHours ?? undefined,
          perDayEndHours: perDayEndHours ?? undefined,
        };
        if (energyData) {
          options.nivel_energia = energyData.nivel_energia;
          options.historial_energia = energyData.historial_energia;
        }
        const generated = await generateScheduleUseCase.execute(startHour, endHour, options);
        set({ schedule: generated });
        await saveScheduleToStorage(generated);
        syncNotifications(generated);
        if (showSuccessAlert) {
          Alert.alert(
            'Horario generado',
            '¡Tu horario ha sido generado con éxito!'
          );
        }
      } catch (e: any) {
        console.error('Error generando horario:', e);
        Alert.alert(
          'Error al generar horario',
          e instanceof Error ? e.message : String(e)
        );
      } finally {
        set({ isLoading: false });
      }
    },

    setSelectedDay: (day) => set({ selectedDay: day }),

    setCalendarViewMode: (mode) => {
      set({ calendarViewMode: mode });
      AsyncStorage.setItem(CALENDAR_VIEW_MODE_KEY, mode).catch(() => {});
    },

    // El estado en memoria se actualiza antes de persistir, no despues: la
    // hora que el usuario acaba de elegir no deberia depender de que la red
    // responda. Si la escritura falla, la UI ya refleja su eleccion y el
    // valor se reintenta en el proximo cambio.
    setStartHour: async (hour) => {
      set({ startHour: hour });
      try {
        await dayLimitPersistence.setStartHour(hour);
      } catch (e) {
        console.error('Error guardando hora de inicio:', e);
      }
    },

    setEndHour: async (hour) => {
      set({ endHour: hour });
      try {
        await dayLimitPersistence.setEndHour(hour);
      } catch (e) {
        console.error('Error guardando hora de fin:', e);
      }
    },

    setRollingWeekStartDay: async (day) => {
      try {
        await dayLimitPersistence.setDiaInicio(day);
        set({ rollingWeekStartDay: day });
      } catch (e) {
        console.error('Error guardando día de inicio de semana:', e);
      }
    },

    setRollingWeekTotalDays: async (days) => {
      try {
        await dayLimitPersistence.setDiasTotales(days);
        set({ rollingWeekTotalDays: days });
      } catch (e) {
        console.error('Error guardando total de días de semana:', e);
      }
    },

    setCustomEnergyPattern: async (pattern) => {
      try {
        await saveEnergyPatternOverride(pattern);
        set({ customEnergyPattern: pattern });
      } catch (e) {
        console.error('Error guardando patrón de energía:', e);
      }
    },

    setPerDayStartHours: async (hours) => {
      try {
        await dayLimitPersistence.setPerDayStartHours(hours);
        set({ perDayStartHours: hours });
      } catch (e) {
        console.error('Error guardando horario de inicio por día:', e);
      }
    },

    setPerDayEndHours: async (hours) => {
      try {
        await dayLimitPersistence.setPerDayEndHours(hours);
        set({ perDayEndHours: hours });
      } catch (e) {
        console.error('Error guardando horario de fin por día:', e);
      }
    },

    handleReschedule: async (affectedActivityId: string, lostMinutes: number) => {
      const { schedule, startHour, endHour } = get();
      if (!schedule || !rescheduleUseCase) return;

      // Get latest energy data for context
      const historial = await getEnergyHistory(14);
      const lastRecord = historial.length > 0 ? historial[0] : null;

      const bloques = scheduleToBloqueTiempo(schedule);
      const horarioActual: ScheduleResponseDto = {
        estado: (schedule.estado as ScheduleEstado) || 'FACTIBLE',
        bloques,
        mensaje: schedule.mensaje || '',
      };

      const { customEnergyPattern, perDayStartHours, perDayEndHours } = get();
      const request: RescheduleRequestDto = {
        horario_actual: horarioActual,
        actividad_afectada_id: affectedActivityId,
        tiempo_perdido_minutos: lostMinutes,
        contexto_usuario: {
          nivel_energia: lastRecord?.nivel ?? 2,
          horario_inicio: perDayStartHours ?? startHour,
          horario_fin: perDayEndHours ?? endHour,
          bloques_sueno: [],
          historial_energia: historial.length > 0 ? historial : undefined,
          patron_energia_manual: customEnergyPattern ?? undefined,
        },
      };

      set({ isLoading: true });
      try {
        const newSchedule = await rescheduleUseCase.execute(request);
        set({ schedule: newSchedule });
        await saveScheduleToStorage(newSchedule);
        syncNotifications(newSchedule);
      } catch (e) {
        console.error('Error replanificando horario:', e);
      } finally {
        set({ isLoading: false });
      }
    },

    handleSuggestTask: async (freeMinutes: number) => {
      if (!suggestTaskUseCase) return [];

      set({ isLoading: true });
      try {
        const suggestions = await suggestTaskUseCase.execute(freeMinutes);
        set({ suggestions });
        return suggestions;
      } catch (e) {
        console.error('Error sugiriendo tareas:', e);
        return [];
      } finally {
        set({ isLoading: false });
      }
    },
  }));

  // La vista del calendario se recuerda sin sesion (es una preferencia local):
  // se recupera al crear el store, cuando AsyncStorage ya respondio.
  AsyncStorage.getItem(CALENDAR_VIEW_MODE_KEY)
    .then((mode) => {
      if (mode === 'grid' || mode === 'list' || mode === 'mes' || mode === 'anual') {
        store.setState({ calendarViewMode: mode });
      }
    })
    .catch(() => {});

  return store;
}

export type { DayLimitPersistence };
