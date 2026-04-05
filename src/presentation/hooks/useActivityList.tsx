import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ApiActivityRepository } from '../../infrastructure/repositories/APIActivityRepository';
import { GenerateScheduleUseCase } from '../../application/useCases/GenerateScheduleUseCase';
import { Activity } from '../../domain/entities/Activity';

export default function useActivityList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Inyección de dependencias (Adaptadores de infraestructura)
  const repository = new ApiActivityRepository();

  // Casos de Uso (Lógica de aplicación)
  const generateScheduleUseCase = new GenerateScheduleUseCase(repository);

  // Carga inicial de datos desde el repositorio
  const loadActivities = async () => {
    try {
      const storedActivities = await repository.getAll();
      setActivities(storedActivities);
    } catch (error) {
      console.error('Error al recuperar actividades:', error);
    }
  };

  // Se dispara cada vez que la pantalla "Actividades" vuelve al foco
  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [])
  );

  const handleEditActivity = (id: string, title: string) => {
    // Aquí podrías navegar al formulario de edición: 
    // navigation.navigate('EditActivity', { id });
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

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    try {
      // Ejecutamos el caso de uso que habla con el Backend (FastAPI + OR-Tools)
      const schedule = await generateScheduleUseCase.execute();
      console.log('Horario optimizado recibido:', schedule);
      return schedule;
    } catch (error) {
      console.error('Error en el proceso de optimización:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activities,
    isLoading,
    handleEditActivity,
    handleDeleteActivity,
    handleGenerateSchedule,
  };
}