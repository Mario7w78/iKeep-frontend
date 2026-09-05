import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';

/**
 * Adonde redirige el enlace de confirmación de email.
 *
 * Tiene que ser un deep link de la app (el scheme `lotus` declarado en
 * app.json), NO un localhost: sin esto Supabase manda al usuario a una URL
 * que la app no sabe abrir y la confirmación queda en el limbo. Este valor
 * además debe figurar en Authentication > URL Configuration del dashboard de
 * Supabase para que el redirect esté autorizado.
 */
export const EMAIL_REDIRECT = 'lotus://confirmar-email';

/** Clave de AsyncStorage donde persistimos el email que falta confirmar. */
export const PENDIENTE_EMAIL_KEY = 'pendiente_email';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  /**
   * El email cuya confirmación estamos esperando (tras un signUp con
   * confirmación habilitada). El deep link de confirmación no trae el email
   * de forma fiable, así que lo guardamos acá para poder llamar verifyOtp.
   */
  pendienteEmail: string | null;
  /**
   * True cuando el usuario acaba de pasar por el deep link de confirmación de
   * email (lotus://confirmar-email) y vuelve a la app. Sirve para que la
   * pantalla de Login le avise que su correo ya fue confirmado.
   */
  recienteConfirmadoEmail: boolean;
  marcarRecienteConfirmado: () => void;
  limpiarRecienteConfirmado: () => void;
  initialize: () => void;
  setPendienteEmail: (email: string | null) => void;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; requireConfirmation: boolean }>;
  /** Confirma el email con el token que llego por deep link o correo. */
  confirmarEmail: (token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isLoading: true,
  pendienteEmail: null,
  recienteConfirmadoEmail: false,

  initialize: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isLoading: false });
    });

    // Recuperamos el email que quedó esperando confirmación (por si la app se
    // cerró y se reabre tocando el enlace del correo).
    AsyncStorage.getItem(PENDIENTE_EMAIL_KEY)
      .then((email) => {
        if (email) set({ pendienteEmail: email });
      })
      .catch(() => {
        // Si falla la lectura, no es bloqueante: solo se pierde la
        // confirmación automática y el usuario puede reintentar el registro.
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isLoading: false });
    });
  },

  setPendienteEmail: (email) => set({ pendienteEmail: email }),
  marcarRecienteConfirmado: () => set({ recienteConfirmadoEmail: true }),
  limpiarRecienteConfirmado: () => set({ recienteConfirmadoEmail: false }),

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password) => {
    // emailRedirectTo lleva el enlace del correo a la app (scheme `lotus`) en
    // vez de a localhost. Si la confirmación está deshabilitada, data.session
    // viene lleno y no hay nada que esperar.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: EMAIL_REDIRECT },
    });

    if (error) return { error: error?.message ?? null, requireConfirmation: false };

    // data.user sin data.session es la senal de que hay que confirmar por
    // email: el usuario todavia no entra, el correo lleva el enlace.
    const requireConfirmation = !!data.user && !data.session;
    if (requireConfirmation) {
      set({ pendienteEmail: email });
      // Lo persistimos para que la confirmación sobreviva al cierre de la app:
      // el usuario puede tocar el enlace del correo más tarde y reabrir la app.
      AsyncStorage.setItem(PENDIENTE_EMAIL_KEY, email).catch(() => {});
    }

    return { error: null, requireConfirmation };
  },

  confirmarEmail: async (token) => {
    if (!token) {
      return { error: 'Falta el codigo de confirmacion del enlace.' };
    }

    // Puede llegar un deep link antes de que `initialize` termine de recuperar
    // el pendiente desde AsyncStorage (carrera al abrir la app desde el correo).
    // Re-leemos el email pendiente directamente si el estado está vacío.
    let email = get().pendienteEmail;
    if (!email) {
      try {
        email = await AsyncStorage.getItem(PENDIENTE_EMAIL_KEY);
      } catch {
        email = null;
      }
    }
    if (!email) {
      return { error: 'Falta el email a confirmar. Vuelve a intentar el registro.' };
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) return { error: error?.message ?? null };

    // Confirmado: ya no hace falta recordar el email pendiente.
    set({ pendienteEmail: null });
    AsyncStorage.removeItem(PENDIENTE_EMAIL_KEY).catch(() => {});
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
  },
}));
