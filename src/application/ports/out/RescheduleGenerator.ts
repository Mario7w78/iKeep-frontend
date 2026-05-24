// src/application/ports/out/RescheduleGenerator.ts
import { ScheduleResponseDto } from '../../../infrastructure/api/dto/ScheduleResponseDto';
import { RescheduleRequestDto } from '../../../infrastructure/api/dto/RescheduleRequestDto';

export interface RescheduleGenerator {
    replanificar(request: RescheduleRequestDto): Promise<ScheduleResponseDto>;
}
