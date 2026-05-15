import AsyncStorage from '@react-native-async-storage/async-storage';

export const onboardingDayLimitPersistence = {
  saveDayLimits: async (startMin: number, endMin: number): Promise<void> => {
    await AsyncStorage.setItem('@day_start_hour', startMin.toString());
    await AsyncStorage.setItem('@day_end_hour', endMin.toString());
  },
};
