import { RescheduleGenerator } from '../../application/ports/out/RescheduleGenerator';
import { RescheduleRequestDto } from '../api/dto/RescheduleRequestDto';
import { ScheduleResponseDto } from '../api/dto/ScheduleResponseDto';
import { RescheduleApiService } from '../api/RescheduleApiService';

export class ApiRescheduleGenerator implements RescheduleGenerator {
    async replanificar(request: RescheduleRequestDto): Promise<ScheduleResponseDto> {
        return await RescheduleApiService(request);
    }
}
