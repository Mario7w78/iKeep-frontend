import { SugerirTareaRequestDto, SugerirTareaResponseDto } from './dto/SuggestTaskDto';

const API_BASE_URL = 'https://ikeep-backend.onrender.com';

export const SuggestTaskApiService = async (
  request: SugerirTareaRequestDto
): Promise<SugerirTareaResponseDto> => {
  const response = await fetch(`${API_BASE_URL}/schedule/suggest-actividades-optimizables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let detail = 'Error al sugerir tareas';
    try {
      const err = await response.json();
      if (err.message) {
        detail = err.message;
      } else if (typeof err.detail === 'string') {
        detail = err.detail;
      } else if (Array.isArray(err.detail) && err.detail[0]?.msg) {
        detail = err.detail.map((d: any) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join('\n');
      } else if (err.error) {
        detail = `${err.error}: ${JSON.stringify(err.detail)}`;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  return await response.json() as SugerirTareaResponseDto;
};
