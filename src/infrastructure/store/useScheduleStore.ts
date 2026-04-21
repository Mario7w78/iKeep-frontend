// src/infrastructure/store/useScheduleStore.ts
import { create } from 'zustand';
import { Schedule } from '../../domain/entities/Schedule';
import { DayOfWeek } from '../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../presentation/utils/scheduleUtils';
import { generateScheduleUseCase } from '../../di/Dependecies';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScheduleStore {
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

    loadDayLimits: async () => {
        try {
            const start = await AsyncStorage.getItem('@day_start_hour');
            const end = await AsyncStorage.getItem('@day_end_hour');
            
            let sH = start !== null ? parseInt(start, 10) : 240; // 4 AM
            let eH = end !== null ? parseInt(end, 10) : 1320;   // 10 PM

            // Safeguard: If stored values are invalid (start >= end), reset to defaults
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
        await get().loadDayLimits(); // Asegurarnos de tener los límites del onboarding
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