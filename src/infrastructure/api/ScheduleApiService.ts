import { ScheduleRequestDto } from './dto/ScheduleRequestDto';
import { ScheduleResponseDto } from './dto/ScheduleResponseDto';

const API_BASE_URL = 'https://ikeep-backend.onrender.com/api/v1/horarios';
const MAX_RETRIES = 2;
const TIMEOUT_MS = 75000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ScheduleApiService = async (
  request: ScheduleRequestDto
): Promise<ScheduleResponseDto> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = 'Error al generar el horario';
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

      return await response.json() as ScheduleResponseDto;
    } catch (e: any) {
      lastError = e;
      // Solo reintentamos en errores de red/abort/timeout, no en errores HTTP
      if (e.name === 'AbortError' || e.message === 'Network request failed') {
        if (attempt < MAX_RETRIES) {
          // Backoff exponencial: 2s, 4s
          await sleep(2000 * Math.pow(2, attempt));
          continue;
        }
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('Error desconocido al generar el horario');
};
