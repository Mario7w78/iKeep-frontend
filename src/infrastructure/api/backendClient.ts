import { supabase } from '../supabase/client';
import { API_ROOT, COLD_START_TIMEOUT_MS, WARM_TIMEOUT_MS } from './apiConfig';

/**
 * Un fallo de una llamada al backend, ya sea HTTP o de transporte.
 *
 * Se unifican a proposito: para quien llama, "el servidor dijo 500" y "no
 * hubo red" se manejan igual —mostrar algo y no perder los datos del
 * usuario— y distinguirlos obligaria a cada caso de uso a repetir la misma
 * bifurcacion.
 */
export class BackendError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
  }

  /** Un 401 significa sesion vencida o invalida: hay que volver a entrar. */
  get isAuthError(): boolean {
    return this.status === 401;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** El primer intento tolera un arranque en frio; los demas no. */
  timeoutMs?: number;
}

/**
 * Llama al backend con el token de la sesion actual.
 *
 * Todas las rutas de datos exigen autenticacion, asi que el token se resuelve
 * aca y no en cada repositorio: uno solo que se olvide de mandarlo seria un
 * 401 en produccion.
 */
export async function backendRequest<T>(
  path: string,
  { method = 'GET', body, timeoutMs = COLD_START_TIMEOUT_MS }: RequestOptions = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    // Se corta antes de la red: sin token el backend responderia 401 igual,
    // y esperar el viaje solo retrasaria el mismo resultado.
    throw new BackendError('No hay sesion activa.', 401);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error: any) {
    const abortada = error?.name === 'AbortError';
    throw new BackendError(
      abortada ? 'El servidor tardo demasiado en responder.' : 'No se pudo conectar.',
      null
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // El cuerpo de los errores de FastAPI suele traer la causa exacta del
    // rechazo (por ejemplo el campo que falló en un 422). Se intenta leer y
    // se expone en el mensaje: diagnosticar a ciegas es lento y adivinar
    // gratuito.
    let detalle = '';
    try {
      const cuerpo = await response.json();
      if (typeof cuerpo === 'string') detalle = cuerpo;
      else if (cuerpo?.detail !== undefined) {
        detalle = typeof cuerpo.detail === 'string' ? cuerpo.detail : JSON.stringify(cuerpo.detail);
      } else {
        detalle = JSON.stringify(cuerpo);
      }
    } catch {
      detalle = '';
    }
    throw new BackendError(
      `El servidor respondio ${response.status}${detalle ? `: ${detalle}` : '.'}`,
      response.status
    );
  }

  // 204 no trae cuerpo; intentar parsearlo tiraria un error de JSON.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** Para reintentos, cuando la instancia ya esta despierta. */
export const RETRY_TIMEOUT_MS = WARM_TIMEOUT_MS;
