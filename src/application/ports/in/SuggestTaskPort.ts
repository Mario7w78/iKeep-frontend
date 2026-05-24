// src/application/ports/in/SuggestTaskPort.ts
import { SugerenciaTareaDto } from '../../../infrastructure/api/dto/SuggestTaskDto';

export interface SuggestTaskPort {
    execute(freeMinutes: number, preferredDay?: number): Promise<SugerenciaTareaDto[]>;
}
