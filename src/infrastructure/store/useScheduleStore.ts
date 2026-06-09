import { create, StoreApi, UseBoundStore } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Schedule, ScheduleProps } from '../../domain/entities/Schedule';
import { Activity, DayOfWeek } from '../../domain/entities/Activity';
import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { GenerateSchedulePort, GenerateScheduleOptions } from '../../application/ports/in/GenerateSchedulePort';
import { ReschedulePort } from '../../application/ports/in/ReschedulePort';
import { SuggestTaskPort } from '../../application/ports/in/SuggestTaskPort';
import { SugerenciaTareaDto } from '../api/dto/SuggestTaskDto';
import { RescheduleRequestDto } from '../api/dto/RescheduleRequestDto';
import { ScheduleResponseDto, ScheduleEstado } from '../api/dto/ScheduleResponseDto';
import { scheduleToBloqueTiempo } from '../api/mappers/rescheduleMapper';
import { EnergyRecord, getEnergyHistory, getEnergyPatternOverride, saveEnergyPatternOverride } from '../persistence/EnergyHistoryService';

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

interface ScheduleStoreState {
  schedule: Schedule | null;
  isLoading: boolean;
  isLoadedFromStorage: boolean;
  selectedDay: DayOfWeek;
  startHour: number;
  endHour: number;
  activitiesForDay: () => ReturnType<Schedule['getItemsByDay']>;
  handleGenerateSchedule: (energyData?: { nivel_energia: number; historial_energia: EnergyRecord[] }) => Promise<void>;
  loadDayLimits: () => Promise<void>;
  loadSchedule: () => Promise<void>;
  setSelectedDay: (day: DayOfWeek) => void;
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

export function createScheduleStore(
  generateScheduleUseCase: GenerateSchedulePort,
  dayLimitPersistence: DayLimitPersistence,
  activityRepository: ActivityRepository,
  rescheduleUseCase?: ReschedulePort,
  suggestTaskUseCase?: SuggestTaskPort
): ScheduleStore {
  const saveScheduleToStorage = async (schedule: Schedule): Promise<void> => {
    try {
      const propsToSave = {
        id: schedule.id,
        userId: schedule.userId,
        createdAt: schedule.createdAt,
        estado: schedule.estado,
        mensaje: schedule.mensaje,
        recomendaciones: schedule.recomendaciones,
        tareasOmitidas: schedule.tareasOmitidas,
        scheduledActivities: schedule.getAllItems().map(item => ({
          activity: item.activity ? {
            id: item.activity.id,
            title: item.activity.title,
            type: item.activity.type,
            identity: item.activity.identity,
            priority: item.activity.priority,
            difficulty: item.activity.difficulty,
            deadline: item.activity.deadline,
            daysEnabled: item.activity.daysEnabled,
            daysConfig: item.activity.daysConfig,
            optionalDay: item.activity.optionalDay,
          } : null,
          assignedStartTime: item.assignedStartTime,
          assignedEndTime: item.assignedEndTime,
          day: item.day,
          tipo: item.tipo,
        }))
      };
      await AsyncStorage.setItem('@schedule', JSON.stringify(propsToSave));
    } catch (e) {
      console.error('Error guardando horario en almacenamiento local:', e);
    }
  };

  return create<ScheduleStoreState>((set, get) => ({
    schedule: null,
    isLoading: false,
    isLoadedFromStorage: false,
    startHour: 0,
    endHour: 1439,
    selectedDay: JS_DAY_TO_DAYOFWEEK[new Date().getDay()],
    suggestions: [],
    rollingWeekStartDay: 0,
    rollingWeekTotalDays: 7,
    customEnergyPattern: null,
    perDayStartHours: null,
    perDayEndHours: null,

    activitiesForDay: () => {
      const { schedule, selectedDay } = get();
      return schedule ? schedule.getItemsByDay(selectedDay) : [];
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

    loadSchedule: async () => {
      try {
        const stored = await AsyncStorage.getItem('@schedule');
        if (stored) {
          const parsed = JSON.parse(stored);
          const scheduledActivities = (parsed.scheduledActivities || []).map((item: any) => ({
            activity: item.activity ? new Activity({
              id: item.activity.id,
              title: item.activity.title,
              type: item.activity.type,
              identity: item.activity.identity,
              priority: item.activity.priority,
              difficulty: item.activity.difficulty,
              deadline: item.activity.deadline,
            daysEnabled: item.activity.daysEnabled,
            daysConfig: item.activity.daysConfig,
            optionalDay: item.activity.optionalDay ?? false,
          }) : undefined,
            assignedStartTime: item.assignedStartTime,
            assignedEndTime: item.assignedEndTime,
            day: item.day,
            tipo: item.tipo,
          }));

          const loadedSchedule = new Schedule({
            id: parsed.id,
            userId: parsed.userId,
            createdAt: new Date(parsed.createdAt),
            estado: parsed.estado,
            mensaje: parsed.mensaje,
            recomendaciones: parsed.recomendaciones ?? [],
            tareasOmitidas: parsed.tareasOmitidas ?? [],
            scheduledActivities
          });

          set({ schedule: loadedSchedule });
        }
      } catch (e) {
        console.error('Error cargando horario de almacenamiento local:', e);
      } finally {
        set({ isLoadedFromStorage: true });
      }
    },

    handleGenerateSchedule: async (energyData) => {
      const existingActivities = await activityRepository.getAll();
      if (existingActivities.length === 0) {
        set({ schedule: null });
        return;
      }

      await get().loadDayLimits();
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

    setStartHour: async (hour) => {
      try {
        await dayLimitPersistence.setStartHour(hour);
        set({ startHour: hour });
      } catch (e) {
        console.error('Error guardando hora de inicio:', e);
      }
    },

    setEndHour: async (hour) => {
      try {
        await dayLimitPersistence.setEndHour(hour);
        set({ endHour: hour });
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
}

export type { DayLimitPersistence };
