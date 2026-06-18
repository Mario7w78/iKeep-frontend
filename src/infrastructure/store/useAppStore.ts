import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { create } from 'zustand';

interface AppState {
  hasSeenOnboarding: boolean;
  username: string;
  themeId: string;
  setHasSeenOnboarding: (value: boolean) => void;
  setUsername: (name: string) => void;
  setThemeId: (id: string) => void;
}


export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      username: '',
      themeId: 'default',
      setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),
      setUsername: (name) => set({ username: name }),
      setThemeId: (id) => set({ themeId: id }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);