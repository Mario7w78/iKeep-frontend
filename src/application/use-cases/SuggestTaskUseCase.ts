// src/application/use-cases/SuggestTaskUseCase.ts
import { SuggestTaskPort } from '../ports/in/SuggestTaskPort';
import { TaskSuggester } from '../ports/out/TaskSuggester';
import { SugerirTareaRequestDto, SugerenciaTareaDto } from '../../infrastructure/api/dto/SuggestTaskDto';
import { ActivityRepository } from '../ports/out/ActivityRepository';
import { domainToTareaPendiente } from '../../infrastructure/api/mappers/suggestTaskMapper';

export class SuggestTaskUseCase implements SuggestTaskPort {
    constructor(
        private taskSuggester: TaskSuggester,
        private activityRepository: ActivityRepository
    ) {}

    async execute(freeMinutes: number, preferredDay?: number): Promise<SugerenciaTareaDto[]> {
        const allActivities = await this.activityRepository.getAll();
        const pendingActivities = allActivities.filter(a => !a.isFixed());

        const request: SugerirTareaRequestDto = {
            tiempo_libre_minutos: freeMinutes,
            tareas_pendientes: domainToTareaPendiente(pendingActivities),
            ...(preferredDay !== undefined && { dia_preferido: preferredDay }),
        };

        const response = await this.taskSuggester.suggestTasks(request);
        return response.sugerencias;
    }
}
