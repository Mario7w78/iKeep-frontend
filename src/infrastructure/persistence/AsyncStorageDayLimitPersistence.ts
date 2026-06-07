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

  getDiaInicio: async () => {
    const val = await AsyncStorage.getItem('@dia_inicio');
    return val !== null ? parseInt(val, 10) : 0;
  },

  getDiasTotales: async () => {
    const val = await AsyncStorage.getItem('@dias_totales');
    return val !== null ? parseInt(val, 10) : 7;
  },

  setDiaInicio: async (val: number) => {
    await AsyncStorage.setItem('@dia_inicio', val.toString());
  },

  setDiasTotales: async (val: number) => {
    await AsyncStorage.setItem('@dias_totales', val.toString());
  },

  getPerDayStartHours: async () => {
    const val = await AsyncStorage.getItem('@per_day_start_hours');
    return val !== null ? JSON.parse(val) : null;
  },

  setPerDayStartHours: async (val: number[] | null) => {
    if (val !== null) {
      await AsyncStorage.setItem('@per_day_start_hours', JSON.stringify(val));
    } else {
      await AsyncStorage.removeItem('@per_day_start_hours');
    }
  },

  getPerDayEndHours: async () => {
    const val = await AsyncStorage.getItem('@per_day_end_hours');
    return val !== null ? JSON.parse(val) : null;
  },

  setPerDayEndHours: async (val: number[] | null) => {
    if (val !== null) {
      await AsyncStorage.setItem('@per_day_end_hours', JSON.stringify(val));
    } else {
      await AsyncStorage.removeItem('@per_day_end_hours');
    }
  },
};
