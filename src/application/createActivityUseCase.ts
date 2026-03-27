import { ActivityStorageService } from '../Services/ActivityStorageService';
import { calculateEndTime, formatTime } from '../domain/timeUtils';

interface CreateActivityCommand {
  activityName: string;
  selectedDuration: string;
  isFixed: boolean;
  startTime: Date;
  selectedCommute: string;
}

export const executeCreateActivity = async (command: CreateActivityCommand): Promise<void> => {
  const { activityName, selectedDuration, isFixed, startTime, selectedCommute } = command;
  
  const endTime = calculateEndTime(startTime, selectedDuration);

  const newActivity = {
      id: Date.now().toString(),
      title: activityName || 'Actividad sin nombre',
      time: isFixed 
          ? `${formatTime(startTime)} - ${formatTime(endTime)}` 
          : `${selectedDuration} (Flexible)`,
      isFixed,
      duration: selectedDuration,
      commute: selectedCommute
  };
  
  // Aquí llamamos al adaptador de infraestructura
  await ActivityStorageService.saveActivity(newActivity);
};