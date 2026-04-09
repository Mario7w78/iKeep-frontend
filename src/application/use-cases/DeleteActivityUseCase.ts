import { ActivityRepository } from '../../domain/repositories/ActivityRepository'
import { DeleteActivityPort } from '../ports/in/DeleteActivityPort';

export class DeleteActivityUseCase implements DeleteActivityPort {

    constructor(
        private activityRepository: ActivityRepository
    ) { }

    async execute(id: string): Promise<void> {
        await this.activityRepository.delete(id)
        return
    }
};