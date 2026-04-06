import { ActivityStorageService } from '../../Services/ActivityStorageService';
import { formatTime } from '../../domain/timeUtils';
import { Activity, ActivityProps, ActivityType, DayOfWeek, } from '../../domain/entities/Activity';

interface CreateActivityCommand {
  activityName: string;
  isFixed: boolean;
  startTime: Date;
  endTime: Date;
  durationTime: number;
  travelTime: number;
  days: DayOfWeek[];
}

export const CreateActivityUseCase = async (command: CreateActivityCommand): Promise<void> => {
  const { activityName, isFixed, startTime, endTime, durationTime, travelTime, days } = command;

  const props: ActivityProps = {
      id: Date.now().toString(),
      title: activityName || 'Actividad sin nombre',
      type: isFixed ? ActivityType.FIXED : ActivityType.FLEXIBLE,
      durationMinutes: durationTime,
      travelMinutes: travelTime,
      daysEnabled: days,
      startTime: isFixed ? formatTime(startTime) : undefined,
      endTime: isFixed ? formatTime(endTime) : undefined,
  };
  const newActivity = new Activity(props);
  
  await ActivityStorageService.saveActivity(newActivity);
};