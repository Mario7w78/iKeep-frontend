import { create, StoreApi, UseBoundStore } from 'zustand';
import { Activity } from '../../domain/entities/Activity';
import { CreateActivityCommand } from '../../application/ports/in/CreateActivityPort';
import { GetActivityPort } from '../../application/ports/in/GetActivityPort';
import { CreateActivityPort } from '../../application/ports/in/CreateActivityPort';
import { DeleteActivityPort } from '../../application/ports/in/DeleteActivityPort';

interface ActivityStoreState {
  activities: Activity[];
  isLoading: boolean;
  /**
   * Timestamp (ms) de la última carga exitosa del backend.
   *
   * Home y Schedule disparan loadActivities en cada foco; sin esta guarda,
   * cada visita vuelve a pedir la red y el usuario ve un flash. Si la última
   * carga fue hace menos de 30 s, se reutiliza (evita recargar tras volver
   * del wizard o cambiar de pestaña). Se resetea al cambiar de usuario.
   */
  ultimaCargaMs: number;
  loadActivities: (forzar?: boolean) => Promise<void>;
  handleCreateActivity: (cmd: CreateActivityCommand) => Promise<void>;
  handleDeleteActivity: (id: string) => Promise<void>;
  handleDeleteAllActivities: () => Promise<void>;
  handleEditActivity: (id: string, title: string) => void;
  /** Vacía el recuerdo de la sesión previa (logout o cambio de usuario). */
  reiniciarSesion: () => void;
}

export type ActivityStore = UseBoundStore<StoreApi<ActivityStoreState>>;

export function createActivityStore(
  getActivityUseCase: GetActivityPort,
  createActivityUseCase: CreateActivityPort,
  deleteActivityUseCase: DeleteActivityPort
): ActivityStore {
  return create<ActivityStoreState>((set, get) => ({
    activities: [],
    // Arranca en "cargando" a propósito: el primer render de Home ocurre antes
    // de que loadActivities (disparado en useFocusEffect) ponga isLoading en
    // true. Si arranca en false, ese primer frame muestra el estado vacío
    // ("No hay actividades / Crea tu primera") aunque el backend aún no
    // respondió — el parpadeo de "vacío al inicio" que reportaban los usuarios
    // con datos creados. loadActivities siempre lo resetea en finally.
    isLoading: true,
    ultimaCargaMs: 0,

    loadActivities: async (forzar = false) => {
      if (!forzar && Date.now() - get().ultimaCargaMs < 30_000) return;
      set({ isLoading: true });
      try {
        const activities = await getActivityUseCase.execute();
        set({ activities, ultimaCargaMs: Date.now() });
      } catch (error) {
        console.error('Error al recuperar actividades:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    handleCreateActivity: async (cmd) => {
      try {
        await createActivityUseCase.execute(cmd);
        await get().loadActivities(true);
      } catch (error) {
        console.error('Error al crear la actividad:', error);
      }
    },

    handleDeleteActivity: async (id) => {
      try {
        await deleteActivityUseCase.execute(id);
        await get().loadActivities(true);
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    },

    handleDeleteAllActivities: async () => {
      const ids = get().activities.map((a) => a.id);
      if (ids.length === 0) return;
      try {
        await Promise.all(ids.map((id) => deleteActivityUseCase.execute(id)));
        await get().loadActivities(true);
      } catch (error) {
        console.error('Error al eliminar todas las actividades:', error);
      }
    },

    handleEditActivity: (id, title) => {
      console.log('Editando:', title);
    },

    reiniciarSesion: () => {
      set({ activities: [], ultimaCargaMs: 0 });
    },
  }));
}
