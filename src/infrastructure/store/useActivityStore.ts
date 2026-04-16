import { create } from 'zustand';
import { Activity } from '../../domain/entities/Activity';
import { deleteActivityUseCase, getActivityUseCase, createActivityUseCase } from '../../di/Dependecies';
import { CreateActivityCommand } from '../../application/ports/in/CreateActivityPort';

interface ActivityStore {
  activities: Activity[];
  isLoading: boolean;
  loadActivities: () => Promise<void>;
  handleCreateActivity: (cmd: CreateActivityCommand) => Promise<void>;
  handleDeleteActivity: (id: string) => Promise<void>;
  handleEditActivity: (id: string, title: string) => void;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
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