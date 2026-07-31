import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initialize: () => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  initialize: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isLoading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isLoading: false });
    });
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
