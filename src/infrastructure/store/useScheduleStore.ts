import { create, StoreApi, UseBoundStore } from 'zustand';
import { Schedule } from '../../domain/entities/Schedule';
import { DayOfWeek } from '../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { GenerateSchedulePort } from '../../application/ports/in/GenerateSchedulePort';

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
}

export type ScheduleStore = UseBoundStore<StoreApi<ScheduleStoreState>>;

export function createScheduleStore(
  generateScheduleUseCase: GenerateSchedulePort,
  dayLimitPersistence: DayLimitPersistence
): ScheduleStore {
  return create<ScheduleStoreState>((set, get) => ({
    schedule: null,
    isLoading: false,
    startHour: 0,
    endHour: 1439,
    selectedDay: JS_DAY_TO_DAYOFWEEK[new Date().getDay()],

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
  }));
}

export type { DayLimitPersistence };
