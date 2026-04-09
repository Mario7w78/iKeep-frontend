import { formatTime } from '../../domain/timeUtils';
import { Activity, ActivityProps, ActivityType, } from '../../domain/entities/Activity';
import { CreateActivityPort, CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { ActivityRepository } from '../../domain/repositories/ActivityRepository'

export class CreateActivityUseCase implements CreateActivityPort {

  constructor(
    private activityRepository: ActivityRepository
  ) { }

  async execute({ activityName, isFixed, startTime, endTime, durationTime, travelTime, days }: CreateActivityCommand): Promise<void> {
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

    await this.activityRepository.save(newActivity);
    return
  }
};