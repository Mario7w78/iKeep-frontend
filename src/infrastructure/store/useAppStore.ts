import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { create } from 'zustand';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  username: string;
  setHasSeenOnboarding: (value: boolean) => void;
  setUsername: (name: string) => void;
}


export const useAppStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      username: '',
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setUsername: (name) => set({ username: name }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);