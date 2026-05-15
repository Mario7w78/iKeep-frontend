// src/application/use-cases/GenerateScheduleUseCase.ts
import { GenerateSchedulePort } from '../ports/in/GenerateSchedulePort'
import { ScheduleGenerator } from '../ports/out/ScheduleGenerator';
import { ActivityRepository } from '../ports/out/ActivityRepository';
import { Schedule } from '../../domain/entities/Schedule';

export class GenerateScheduleUseCase implements GenerateSchedulePort {
    constructor(
        private scheduleGenerator: ScheduleGenerator,
        private activityRepository: ActivityRepository
    ) { }

    async execute(startHour: number, endHour: number): Promise<Schedule> {
        const activities = await this.activityRepository.getAll();
        
        if (activities.length === 0) {
            throw new Error("No hay actividades para generar un horario");
        }
        
        return await this.scheduleGenerator.generate(activities, startHour, endHour);
    }
}