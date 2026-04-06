import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApiActivityRepository } from '../../infrastructure/repositories/APIActivityRepository';
import { GenerateScheduleUseCase } from '../../application/useCase/GenerateScheduleUseCase';
import { Activity } from '../../domain/entities/Activity';

export default function useActivityListAdapter() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const repository = new ApiActivityRepository();

  const loadActivities = async () => {
    try {
      const storedActivities = await repository.getAll();
      setActivities(storedActivities);
    } catch (error) {
      console.error('Error al recuperar actividades:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [])
  );

  const handleEditActivity = (id: string, title: string) => {
    console.log('Editando:', title);
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await repository.delete(id);
      await loadActivities();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  return {
    activities,
    isLoading,
    handleEditActivity,
    handleDeleteActivity,
  };
}