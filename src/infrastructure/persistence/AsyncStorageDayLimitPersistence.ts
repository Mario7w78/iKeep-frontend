import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayLimitPersistence } from '../store/useScheduleStore';

export const asyncStorageDayLimitPersistence: DayLimitPersistence = {
  getStartHour: async () => {
    const start = await AsyncStorage.getItem('@day_start_hour');
    return start !== null ? parseInt(start, 10) : 240;
  },

  getEndHour: async () => {
    const end = await AsyncStorage.getItem('@day_end_hour');
    return end !== null ? parseInt(end, 10) : 1320;
  },

  setStartHour: async (hour: number) => {
    await AsyncStorage.setItem('@day_start_hour', hour.toString());
  },

  setEndHour: async (hour: number) => {
    await AsyncStorage.setItem('@day_end_hour', hour.toString());
  },
};
