// src/application/ports/in/ReschedulePort.ts
import { Schedule } from '../../../domain/entities/Schedule';
import { RescheduleRequestDto } from '../../../infrastructure/api/dto/RescheduleRequestDto';

export interface ReschedulePort {
    execute(request: RescheduleRequestDto): Promise<Schedule>;
}
