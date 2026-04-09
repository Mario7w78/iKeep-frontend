// src/application/use-cases/GenerateScheduleUseCase.ts
import { GenerateSchedulePort } from '../ports/in/GenerateSchedulePort'
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { ActivityRepository } from '../../domain/repositories/ActivityRepository';
import { Schedule } from '../../domain/entities/Schedule';

export class GenerateScheduleUseCase implements GenerateSchedulePort {
    constructor(
        private scheduleRepository: ScheduleRepository,
        private activityRepository: ActivityRepository
    ) { }

    async execute(): Promise<Schedule> {
        const activities = await this.activityRepository.getAll();
        
        if (activities.length === 0) {
            throw new Error("No hay actividades para generar un horario");
        }
        
        return await this.scheduleRepository.generate(activities);
    }
}