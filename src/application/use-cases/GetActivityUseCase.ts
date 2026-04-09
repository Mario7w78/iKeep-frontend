import { Activity } from '../../domain/entities/Activity'
import { ActivityRepository } from '../../domain/repositories/ActivityRepository'
import { GetActivityPort } from '../ports/in/GetActivityPort'

export class GetActivityUseCase implements GetActivityPort {
    constructor(
        private activityRepository: ActivityRepository
    ) { }

    async execute(): Promise<Activity[]> {
        return  await this.activityRepository.getAll()
    }
};