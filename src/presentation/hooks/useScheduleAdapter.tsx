import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { GenerateScheduleUseCase } from '../../application/useCase/GenerateScheduleUseCase';
import { ApiScheduleRepository } from '../../infrastructure/repositories/APIScheduleRepository';
import { ApiActivityRepository } from '../../infrastructure/repositories/APIActivityRepository';
import { Schedule } from '../../domain/entities/Schedule';

const activityRepo = new ApiActivityRepository();
const scheduleRepo = new ApiScheduleRepository();
const generateUseCase = new GenerateScheduleUseCase(scheduleRepo);

export default function useScheduleAdapter() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateSchedule = useCallback(async () => {
    const currentActivities = await activityRepo.getAll();

    if (currentActivities.length === 0) {
      setSchedule(null);
      return;
    }

    setIsLoading(true);
    try {
      const generatedSchedule = await generateUseCase.execute(currentActivities);
      setSchedule(generatedSchedule);
      return generatedSchedule;
    } catch (error) {
      console.error('Error en el proceso de optimización:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      handleGenerateSchedule();
    }, [handleGenerateSchedule])
  );

  return {
    schedule,
    isLoading,
    handleGenerateSchedule,
    currentDayActivities: schedule ? schedule.getAllItems() : []
  };
}