import { ActivityRepository } from '../../domain/repositories/ActivityRepository';

export class GenerateScheduleUseCase {
    constructor(private repository: ActivityRepository) { }

    async execute() {
        const activities = await this.repository.getAll();
        if (activities.length === 0) throw new Error("No hay actividades para organizar");

        return await this.repository.generateSchedule(activities);
    }
}