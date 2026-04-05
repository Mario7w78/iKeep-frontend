import { ActivityStorageService } from '../Services/ActivityStorageService';
import { calculateEndTime, formatTime } from '../domain/timeUtils';
import { frecuency } from '../domain/entities/activity.types';

interface CreateActivityCommand {
  activityName: string;
  selectedDuration: string;
  isFixed: boolean;
  startTime: Date;
  endTime: Date;
  selectedTravelTime: string;
  days: frecuency[];
}

export const executeCreateActivity = async (command: CreateActivityCommand): Promise<void> => {
  const { activityName, selectedDuration, isFixed, startTime, endTime, selectedTravelTime, days } = command;

  const newActivity = {
      id: Date.now().toString(),
      title: activityName || 'Actividad sin nombre',
      time: isFixed 
          ? `${formatTime(startTime)} - ${formatTime(endTime)}` 
          : `${selectedDuration} (Flexible)`,
      isFixed,
      duration: selectedDuration,
      commute: selectedTravelTime,
      days: days
  };
  
  await ActivityStorageService.saveActivity(newActivity);
};