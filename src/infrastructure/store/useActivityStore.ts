import { create, StoreApi, UseBoundStore } from 'zustand';
import { Activity } from '../../domain/entities/Activity';
import { CreateActivityCommand } from '../../application/ports/in/CreateActivityPort';
import { GetActivityPort } from '../../application/ports/in/GetActivityPort';
import { CreateActivityPort } from '../../application/ports/in/CreateActivityPort';
import { DeleteActivityPort } from '../../application/ports/in/DeleteActivityPort';

interface ActivityStoreState {
  activities: Activity[];
  isLoading: boolean;
  loadActivities: () => Promise<void>;
  handleCreateActivity: (cmd: CreateActivityCommand) => Promise<void>;
  handleDeleteActivity: (id: string) => Promise<void>;
  handleEditActivity: (id: string, title: string) => void;
}

export type ActivityStore = UseBoundStore<StoreApi<ActivityStoreState>>;

export function createActivityStore(
  getActivityUseCase: GetActivityPort,
  createActivityUseCase: CreateActivityPort,
  deleteActivityUseCase: DeleteActivityPort
): ActivityStore {
  return create<ActivityStoreState>((set, get) => ({
    activities: [],
    isLoading: false,

    loadActivities: async () => {
      set({ isLoading: true });
      try {
        const activities = await getActivityUseCase.execute();
        set({ activities });
      } catch (error) {
        console.error('Error al recuperar actividades:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    handleCreateActivity: async (cmd) => {
      try {
        await createActivityUseCase.execute(cmd);
        await get().loadActivities();
      } catch (error) {
        console.error('Error al crear la actividad:', error);
      }
    },

    handleDeleteActivity: async (id) => {
      try {
        await deleteActivityUseCase.execute(id);
        await get().loadActivities();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    },

    handleEditActivity: (id, title) => {
      console.log('Editando:', title);
    },
  }));
}
