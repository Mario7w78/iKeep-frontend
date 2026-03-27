import AsyncStorage from '@react-native-async-storage/async-storage';

// La "llave" con la que guardaremos nuestra caja de datos en el celular
const STORAGE_KEY = '@ikeep_activities';

export type Activity = {
  id: string;
  title: string;
  time: string;
  isFixed: boolean;
  duration: string;
  commute: string;
};

export const ActivityStorageService = {
  // Obtener todas las actividades
  getActivities: async (): Promise<Activity[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error leyendo actividades locales', e);
      return [];
    }
  },

  // Guardar una nueva actividad
  saveActivity: async (activity: Activity): Promise<void> => {
    try {
      const currentActivities = await ActivityStorageService.getActivities();
      const newActivities = [...currentActivities, activity];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));
    } catch (e) {
      console.error('Error guardando la actividad', e);
    }
  },

  // Eliminar una actividad
  deleteActivity: async (id: string): Promise<void> => {
    try {
      const currentActivities = await ActivityStorageService.getActivities();
      const newActivities = currentActivities.filter(a => a.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newActivities));
    } catch (e) {
      console.error('Error eliminando la actividad', e);
    }
  }
};