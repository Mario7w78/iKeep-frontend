import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  SesionEnfocada,
  estadoDe,
  iniciar,
  minutosAcreditables,
  registrarSalida,
} from '../../domain/services/focusSession';
import { completarActividad, fechaLocal } from '../api/RewardsApiService';

/**
 * La sesión enfocada, guardada.
 *
 * Se persiste porque el caso que importa es justamente el que la memoria no
 * cubre: alguien empieza a estudiar, deja el teléfono de lado, el sistema
 * mata la app para liberar memoria, y al volver la sesión tiene que seguir
 * ahí. Si desapareciera, la app estaría castigando exactamente la conducta
 * que quiere fomentar.
 *
 * Lo que se guarda es la marca de inicio, no un contador: al reabrir, el
 * tiempo se recalcula del reloj. Un contador guardado se habría quedado
 * dormido mientras la app no existía.
 */

/** Sube cuando cambia la forma; lo guardado con otra se descarta. */
const VERSION = 1;

interface FocusSessionState {
  sesion: SesionEnfocada | null;
  guardando: boolean;
  iniciarSesion: (activityId: string, metaMinutos: number) => void;
  /** Se fue de la app. No cancela: solo se anota. */
  anotarSalida: () => void;
  /**
   * El usuario confirma que la hizo. Es el único camino a "hecha": la sesión
   * nunca marca sola.
   */
  terminar: () => Promise<void>;
  /** La cierra sin afirmar nada. Queda sin resolver, que no suma ni resta. */
  descartar: () => void;
}

export const useFocusSessionStore = create<FocusSessionState>()(
  persist(
    (set, get) => ({
      sesion: null,
      guardando: false,

      iniciarSesion: (activityId, metaMinutos) => {
        set({ sesion: iniciar(activityId, metaMinutos) });
      },

      anotarSalida: () => {
        const { sesion } = get();
        if (!sesion) return;
        set({ sesion: registrarSalida(sesion) });
      },

      terminar: async () => {
        const { sesion } = get();
        if (!sesion) return;

        // Una sesión caducada no afirma nada por su cuenta. Empezar 25
        // minutos y volver a abrir la app al día siguiente no significa haber
        // estudiado catorce horas, y escribirlo envenenaría el único dato que
        // esta app puede producir.
        if (estadoDe(sesion) === 'caducada') {
          set({ sesion: null });
          return;
        }

        set({ guardando: true });
        try {
          await completarActividad(
            sesion.activityId,
            fechaLocal(),
            'hecha',
            // Saber después si lo hecho por sesión se cumple distinto de lo
            // marcado a mano es una respuesta útil; por eso viaja el origen.
            'sesion'
          );
          set({ sesion: null });
        } catch (error) {
          // La sesión se conserva: perderla por un fallo de red obligaría al
          // usuario a rehacer el trabajo que ya hizo.
          console.error('No se pudo guardar la sesión:', error);
          throw error;
        } finally {
          set({ guardando: false });
        }
      },

      descartar: () => set({ sesion: null }),
    }),
    {
      name: `focus-session-v${VERSION}`,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (estado) => ({ sesion: estado.sesion }),
    }
  )
);

export { minutosAcreditables };
