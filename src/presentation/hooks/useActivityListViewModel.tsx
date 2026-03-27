import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityStorageService, Activity } from '../../Services/ActivityStorageService';

export default function useActivityListViewModel() {
  const [activities, setActivities] = useState<Activity[]>([]);

  // Función que va a buscar las actividades al celular
  const loadActivities = async () => {
    const storedActivities = await ActivityStorageService.getActivities();
    setActivities(storedActivities);
  };
  // useFocusEffect se ejecuta CADA VEZ que esta pantalla aparece frente al usuario
  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [])
  );

  const handleEditActivity = (id: string, title: string) => {
    console.log('Intención de editar:', title);
  };

  const handleDeleteActivity = async (id: string, title: string) => {
    await ActivityStorageService.deleteActivity(id);
    loadActivities(); 
  };

  return {
    activities,
    handleEditActivity,
    handleDeleteActivity,
  };
}