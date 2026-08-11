import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { ComportamientoActividad } from '../../domain/entities/activityBehavior';
import { restoreDaysConfig } from '../repositories/daysConfigMapper';

/**
 * Lo que el usuario llevaba escrito en el wizard.
 *
 * La confirmación de descarte que se agregó en la Fase 0 era un parche: evita
 * perder el trabajo por accidente, pero obliga a decidir en el momento y no
 * ayuda si la app se cierra sola, si entra una llamada o si el usuario quiere
 * ir a mirar algo y volver.
 *
 * Con el borrador guardado, cerrar deja de ser destructivo: al volver está
 * todo donde estaba.
 *
 * Solo se guarda al crear. Editando ya hay una actividad de la cual partir, y
 * restaurar encima seria mezclar dos cosas distintas.
 */

/** Sube cuando cambia la forma del borrador; lo guardado con otra se descarta. */
const VERSION = 1;

export interface BorradorWizard {
  activityName: string;
  identity: 'clase' | 'trabajo' | 'tarea';
  comportamiento: ComportamientoActividad;
  selectedDays: string[];
  daysDict: Record<string, any>;
  difficulty: 'baja' | 'media' | 'alta';
  priority: 'baja' | 'media' | 'alta';
  deadline: string | null;
  /** Momento en que se guardó, para poder caducarlo. */
  guardadoEn: number;
}

/**
 * Después de esto el borrador se descarta al abrir.
 *
 * Una semana más tarde el usuario ya no recuerda qué estaba creando, y
 * restaurarle un formulario a medias es más confuso que empezar limpio.
 */
const CADUCA_EN_MS = 24 * 60 * 60 * 1000;

interface WizardDraftState {
  borrador: BorradorWizard | null;
  guardar: (borrador: Omit<BorradorWizard, 'guardadoEn'>) => void;
  /** El borrador si sirve; null si no hay o si caducó. */
  recuperar: () => BorradorWizard | null;
  limpiar: () => void;
}

export const useWizardDraftStore = create<WizardDraftState>()(
  persist(
    (set, get) => ({
      borrador: null,

      guardar: (borrador) =>
        set({ borrador: { ...borrador, guardadoEn: Date.now() } }),

      recuperar: () => {
        const actual = get().borrador;
        if (!actual) return null;

        if (Date.now() - actual.guardadoEn > CADUCA_EN_MS) {
          // Se limpia al detectarlo, no solo se ignora: si no, el borrador
          // viejo quedaría ocupando espacio para siempre.
          set({ borrador: null });
          return null;
        }

        // Las horas de los turnos vuelven a ser Date antes de salir de acá.
        // El borrador viaja por AsyncStorage, así que pasa por JSON y los
        // Date llegan como texto ISO. El DateTimePicker exige un Date de
        // verdad: con el texto crudo revienta al tocar una hora.
        //
        // Se restaura en el store y no en quien lo consume porque olvidarlo
        // es justamente lo que pasó, y acá hay un solo lugar donde hacerlo.
        return {
          ...actual,
          daysDict: restoreDaysConfig(actual.daysDict) as Record<string, any>,
        };
      },

      limpiar: () => set({ borrador: null }),
    }),
    {
      name: `wizard-draft-v${VERSION}`,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
