import { formatTime } from '../../presentation/utils/timeUtils';
import { Activity, ActivityProps, ActivityType, } from '../../domain/entities/Activity';
import { CreateActivityPort, CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { ActivityRepository } from '../../domain/repositories/ActivityRepository'

export class CreateActivityUseCase implements CreateActivityPort {

  constructor(
    private activityRepository: ActivityRepository
  ) { }

  async execute({ activityName, isFixed, daysConfig, days }: CreateActivityCommand): Promise<void> {
    const props: ActivityProps = {
      id: Date.now().toString(),
      title: activityName || 'Actividad sin nombre',
      type: isFixed ? ActivityType.FIXED : ActivityType.FLEXIBLE,
      daysConfig: daysConfig,
      daysEnabled: days,
    };
    const newActivity = new Activity(props);

    await this.activityRepository.save(newActivity);
    return
  }
};