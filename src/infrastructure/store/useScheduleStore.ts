// src/infrastructure/store/useScheduleStore.ts
import { create } from 'zustand';
import { Schedule } from '../../domain/entities/Schedule';
import { DayOfWeek } from '../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { generateScheduleUseCase } from '../../di/Dependecies';

interface ScheduleStore {
    schedule: Schedule | null;
    isLoading: boolean;
    selectedDay: DayOfWeek;
    startHour: number;
    endHour: number;
    activitiesForDay: () => ReturnType<Schedule['getItemsByDay']>;
    handleGenerateSchedule: () => Promise<void>;
    setSelectedDay: (day: DayOfWeek) => void;
    setStartHour: (hour: number) => void;
    setEndHour: (hour: number) => void;
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
    schedule: null,
    isLoading: false,
    startHour: 0,
    endHour: 1439,
    selectedDay: JS_DAY_TO_DAYOFWEEK[new Date().getDay()],

    activitiesForDay: () => {
        const { schedule, selectedDay } = get();
        return schedule ? schedule.getItemsByDay(selectedDay) : [];
    },

    handleGenerateSchedule: async () => {
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

    setStartHour(hour) {
        set({ startHour: hour })
    },

    setEndHour(hour) {
        set({ endHour: hour })
    },

}));