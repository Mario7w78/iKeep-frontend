import { TaskSuggester } from '../../application/ports/out/TaskSuggester';
import { SugerirTareaRequestDto, SugerirTareaResponseDto } from '../api/dto/SuggestTaskDto';
import { SuggestTaskApiService } from '../api/SuggestTaskApiService';

export class ApiTaskSuggester implements TaskSuggester {
    async suggestTasks(request: SugerirTareaRequestDto): Promise<SugerirTareaResponseDto> {
        return await SuggestTaskApiService(request);
    }
}
