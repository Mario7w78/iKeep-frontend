import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { create } from 'zustand';

/** Minutes from midnight, the unit the scheduler works in. */
export interface DayLimits {
  startHour: number;
  endHour: number;
}

interface AppState {
  hasSeenOnboarding: boolean;
  username: string;
  /**
   * Day limits chosen during onboarding, waiting for a session.
   *
   * Onboarding runs before sign-in, so there is nobody to save them for yet:
   * user_settings is scoped by auth.uid() and the write would be rejected.
   * They are parked here — this store persists to AsyncStorage, so they
   * survive the user closing the app mid-signup — and flushed once a session
   * exists.
   */
  pendingDayLimits: DayLimits | null;
  setHasSeenOnboarding: (value: boolean) => void;
  setUsername: (name: string) => void;
  setPendingDayLimits: (limits: DayLimits) => void;
  clearPendingDayLimits: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      username: '',
      pendingDayLimits: null,
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setUsername: (name) => set({ username: name }),
      setPendingDayLimits: (limits) => set({ pendingDayLimits: limits }),
      clearPendingDayLimits: () => set({ pendingDayLimits: null }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
