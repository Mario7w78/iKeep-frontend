import { Activity, ActivityProps, ActivityType, } from '../../domain/entities/Activity';
import { CreateActivityPort, CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { ActivityRepository } from '../ports/out/ActivityRepository'
import { comandoAActividad } from '../mappers/commandToActivity';

export class CreateActivityUseCase implements CreateActivityPort {

  constructor(
    private activityRepository: ActivityRepository
  ) { }

  async execute(command: CreateActivityCommand): Promise<void> {
    const newActivity = comandoAActividad(command);

    await this.activityRepository.save(newActivity);
    return
  }
};