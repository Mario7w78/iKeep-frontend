import { SugerirTareaRequestDto, SugerirTareaResponseDto } from './dto/SuggestTaskDto';

const API_BASE_URL = 'https://ikeep-backend.onrender.com';

export const SuggestTaskApiService = async (
  request: SugerirTareaRequestDto
): Promise<SugerirTareaResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/schedule/suggest-task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let detail = 'Error al sugerir tareas';
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return await response.json() as SugerirTareaResponseDto;
};
