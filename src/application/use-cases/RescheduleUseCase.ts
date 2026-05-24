// src/application/use-cases/RescheduleUseCase.ts
import { ReschedulePort } from '../ports/in/ReschedulePort';
import { RescheduleGenerator } from '../ports/out/RescheduleGenerator';
import { ActivityRepository } from '../ports/out/ActivityRepository';
import { Schedule } from '../../domain/entities/Schedule';
import { RescheduleRequestDto } from '../../infrastructure/api/dto/RescheduleRequestDto';
import { scheduleResponseToDomain } from '../../infrastructure/api/mappers/scheduleMapper';

export class RescheduleUseCase implements ReschedulePort {
    constructor(
        private rescheduleGenerator: RescheduleGenerator,
        private activityRepository: ActivityRepository
    ) {}

    async execute(request: RescheduleRequestDto): Promise<Schedule> {
        const response = await this.rescheduleGenerator.replanificar(request);
        const activities = await this.activityRepository.getAll();
        return scheduleResponseToDomain(response, activities);
    }
}
