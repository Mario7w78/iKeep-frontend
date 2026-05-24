import { RescheduleRequestDto } from './dto/RescheduleRequestDto';
import { ScheduleResponseDto } from './dto/ScheduleResponseDto';

const API_BASE_URL = 'https://ikeep-backend.onrender.com/api/v1/horarios';

export const RescheduleApiService = async (
  request: RescheduleRequestDto
): Promise<ScheduleResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/replanificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let detail = 'Error al replanificar el horario';
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return await response.json() as ScheduleResponseDto;
};
