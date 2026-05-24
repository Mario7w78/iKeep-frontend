// src/application/ports/out/TaskSuggester.ts
import { SugerirTareaRequestDto, SugerirTareaResponseDto } from '../../../infrastructure/api/dto/SuggestTaskDto';

export interface TaskSuggester {
    suggestTasks(request: SugerirTareaRequestDto): Promise<SugerirTareaResponseDto>;
}
