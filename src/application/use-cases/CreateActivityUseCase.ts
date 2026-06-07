import { Activity, ActivityProps, ActivityType, } from '../../domain/entities/Activity';
import { CreateActivityPort, CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { ActivityRepository } from '../ports/out/ActivityRepository'

export class CreateActivityUseCase implements CreateActivityPort {

  constructor(
    private activityRepository: ActivityRepository
  ) { }

  async execute({ id, activityName, isFixed, identity, priority, difficulty, deadline, daysConfig, days, preferredStartTime, preferredEndTime, optionalDay, dayFrom, dayTo, isAnchor }: CreateActivityCommand): Promise<void> {
    const props: ActivityProps = {
      id: id || Date.now().toString(),
      title: activityName || 'Actividad sin nombre',
      type: isFixed ? ActivityType.FIXED : ActivityType.FLEXIBLE,
      identity,
      priority,
      difficulty,
      deadline,
      daysConfig: daysConfig,
      daysEnabled: days,
      preferredStartTime,
      preferredEndTime,
      optionalDay: optionalDay ?? false,
      dayFrom,
      dayTo,
      isAnchor: isAnchor ?? false,
    };
    const newActivity = new Activity(props);

    await this.activityRepository.save(newActivity);
    return
  }
};