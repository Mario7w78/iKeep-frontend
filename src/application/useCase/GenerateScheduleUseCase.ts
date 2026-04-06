// src/application/use-cases/GenerateScheduleUseCase.ts
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { Activity } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';

export class GenerateScheduleUseCase {
    constructor(private repository: ScheduleRepository) { }

    async execute(activities: Activity[]): Promise<Schedule> {
        if (activities.length === 0) {
            throw new Error("No hay actividades para generar un horario");
        }
        
        return await this.repository.generate(activities);
    }
}