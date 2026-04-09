// hooks/useSchedule.ts
import { useState, useCallback } from 'react';
import { Schedule } from '../../domain/entities/Schedule';
import { DayOfWeek } from '../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../utils/scheduleUtils';
import { generateScheduleUseCase } from '../../di/Dependecies';

export default function useSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    JS_DAY_TO_DAYOFWEEK[new Date().getDay()]
  );

  const handleGenerateSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const generated = await generateScheduleUseCase.execute();
      setSchedule(generated);
    } catch (e) {
      console.error('Error generando horario:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const activitiesForDay = schedule
    ? schedule.getItemsByDay(selectedDay) 
    : [];

  return { schedule, isLoading, handleGenerateSchedule, selectedDay, setSelectedDay, activitiesForDay };
}