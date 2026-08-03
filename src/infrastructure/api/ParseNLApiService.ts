import type {
  ParseNLResponseDto,
  MessageDto,
  ParseNLConversationRequestDto,
  ParseNLConversationResponseDto,
} from './dto/ParseNLDto';

import {
  API_BASE_URL,
  COLD_START_TIMEOUT_MS,
  WARM_TIMEOUT_MS,
} from './apiConfig';

const MAX_RETRIES = 2;
const TIMEOUT_MS = 20000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ParseNLRequest {
  text: string;
}

const apiClient = {
  post: async <T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let detail = 'No se pudo procesar la solicitud';
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

    return response.json() as Promise<T>;
  },
};

const withRetry = async <T>(
  fn: (signal: AbortSignal) => Promise<T>,
  retries: number
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // The first attempt may have to wait out a Render cold start; by the time
    // we retry the instance is awake, so a short budget is right.
    const timeoutMs = attempt === 0 ? COLD_START_TIMEOUT_MS : WARM_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fn(controller.signal);
    } catch (e: any) {
      lastError = e;
      if (attempt < retries && (e.name === 'AbortError' || e.message === 'Network request failed')) {
        await sleep(2000 * Math.pow(2, attempt));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('No se pudo procesar la solicitud');
};

export const ParseNLApiService = async (
  request: ParseNLRequest
): Promise<ParseNLResponseDto> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(`${API_BASE_URL}/parse-nl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail = 'No se pudo analizar el texto';
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

      return await response.json() as ParseNLResponseDto;
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

  throw lastError ?? new Error('No se pudo analizar el texto');
};

export async function sendConversation(
  text: string,
  history: MessageDto[],
  agendaContext?: string,
  currentDay?: string
): Promise<ParseNLConversationResponseDto> {
  const body: ParseNLConversationRequestDto = {
    text,
    history,
    agenda_context: agendaContext,
    current_day: currentDay,
  };

  return withRetry(
    (signal) =>
      apiClient.post<ParseNLConversationResponseDto>(
        `${API_BASE_URL}/parse-nl-conversation`,
        body,
        signal
      ),
    2
  );
}

