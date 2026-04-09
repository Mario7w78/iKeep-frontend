import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Activity } from '../../domain/entities/Activity';
import { deleteActivityUseCase, getActivityUseCase, createActivityUseCase } from '../../di/Dependecies';
import { CreateActivityCommand } from '../../application/ports/in/CreateActivityPort';

export default function useActivityList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadActivities = async () => {
    try {
      const storedActivities = await getActivityUseCase.execute();
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
      await deleteActivityUseCase.execute(id);
      await loadActivities();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleCreateActivity = async ({ activityName, isFixed, startTime, endTime, durationTime, travelTime, days }: CreateActivityCommand) => {
    try {
      await createActivityUseCase.execute({ activityName, isFixed, startTime, endTime, durationTime, travelTime, days });
      await loadActivities();
    } catch (error) {
      console.error('Error al crear la actividad:', error);
    }
  }

  return {
    activities,
    isLoading,
    handleEditActivity,
    handleDeleteActivity,
    handleCreateActivity,
  };
}