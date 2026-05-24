import { create, StoreApi, UseBoundStore } from 'zustand';
import { Schedule } from '../../domain/entities/Schedule';
import { DayOfWeek } from '../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { GenerateSchedulePort } from '../../application/ports/in/GenerateSchedulePort';
import { ReschedulePort } from '../../application/ports/in/ReschedulePort';
import { SuggestTaskPort } from '../../application/ports/in/SuggestTaskPort';
import { SugerenciaTareaDto } from '../api/dto/SuggestTaskDto';
import { RescheduleRequestDto } from '../api/dto/RescheduleRequestDto';
import { ScheduleResponseDto, ScheduleEstado } from '../api/dto/ScheduleResponseDto';
import { scheduleToBloqueTiempo } from '../api/mappers/rescheduleMapper';

interface DayLimitPersistence {
  getStartHour: () => Promise<number>;
  getEndHour: () => Promise<number>;
  setStartHour: (hour: number) => Promise<void>;
  setEndHour: (hour: number) => Promise<void>;
}

interface ScheduleStoreState {
  schedule: Schedule | null;
  isLoading: boolean;
  selectedDay: DayOfWeek;
  startHour: number;
  endHour: number;
  activitiesForDay: () => ReturnType<Schedule['getItemsByDay']>;
  handleGenerateSchedule: () => Promise<void>;
  loadDayLimits: () => Promise<void>;
  setSelectedDay: (day: DayOfWeek) => void;
  setStartHour: (hour: number) => void;
  setEndHour: (hour: number) => void;
  suggestions: SugerenciaTareaDto[];
  handleReschedule: (affectedActivityId: string, lostMinutes: number) => Promise<void>;
  handleSuggestTask: (freeMinutes: number) => Promise<SugerenciaTareaDto[]>;
}

export type ScheduleStore = UseBoundStore<StoreApi<ScheduleStoreState>>;

export function createScheduleStore(
  generateScheduleUseCase: GenerateSchedulePort,
  dayLimitPersistence: DayLimitPersistence,
  rescheduleUseCase?: ReschedulePort,
  suggestTaskUseCase?: SuggestTaskPort
): ScheduleStore {
  return create<ScheduleStoreState>((set, get) => ({
    schedule: null,
    isLoading: false,
    startHour: 0,
    endHour: 1439,
    selectedDay: JS_DAY_TO_DAYOFWEEK[new Date().getDay()],
    suggestions: [],

    activitiesForDay: () => {
      const { schedule, selectedDay } = get();
      return schedule ? schedule.getItemsByDay(selectedDay) : [];
    },

    loadDayLimits: async () => {
      try {
        const start = await dayLimitPersistence.getStartHour();
        const end = await dayLimitPersistence.getEndHour();

        let sH = start !== null ? start : 240;
        let eH = end !== null ? end : 1320;

        if (sH >= eH) {
          sH = 240;
          eH = 1320;
        }

        set({ startHour: sH, endHour: eH });
      } catch (e) {
        console.error('Error cargando límites del día:', e);
      }
    },

    handleGenerateSchedule: async () => {
      await get().loadDayLimits();
      const { startHour, endHour } = get();
      set({ isLoading: true });
      try {
        const generated = await generateScheduleUseCase.execute(startHour, endHour);
        set({ schedule: generated });
      } catch (e) {
        console.error('Error generando horario:', e);
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

    handleReschedule: async (affectedActivityId: string, lostMinutes: number) => {
      const { schedule, startHour, endHour } = get();
      if (!schedule || !rescheduleUseCase) return;

      const bloques = scheduleToBloqueTiempo(schedule);
      const horarioActual: ScheduleResponseDto = {
        estado: (schedule.estado as ScheduleEstado) || 'DESCONOCIDO',
        bloques,
        mensaje: schedule.mensaje || '',
      };

      const request: RescheduleRequestDto = {
        horario_actual: horarioActual,
        actividad_afectada_id: affectedActivityId,
        tiempo_perdido_minutos: lostMinutes,
        contexto_usuario: {
          nivel_energia: 5,
          horario_inicio: startHour,
          horario_fin: endHour,
          bloques_sueno: [],
        },
      };

      set({ isLoading: true });
      try {
        const newSchedule = await rescheduleUseCase.execute(request);
        set({ schedule: newSchedule });
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
