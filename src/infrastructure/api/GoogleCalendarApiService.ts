import { backendRequest } from './backendClient';

/**
 * La puerta del backend para Google Calendar.
 *
 * Es un espejo de GoogleCalendarApiService del lado del servidor, pero en
 * camelCase: el contrato HTTP viaja en snake_case y la traduccion vive aca,
 * una sola vez, para que ni el store ni la UI sepan como habla el backend.
 */

const RUTA_GOOGLE = '/api/v1/google';
const RUTA_CALENDARIO_GOOGLE = '/api/v1/calendario/google';

/** Un evento importado de Google, tal como lo dibuja el mes. */
export interface EventoImportado {
  id: string;
  /** Tal cual vino de Google: sin prefijos ni adornos (spec external-events-ui). */
  titulo: string;
  inicio: string;
  fin: string;
  todoElDia: boolean;
}

/** Lo que responde pedir la ventana: los eventos y en qué dias cae cada uno. */
export interface VentanaGoogle {
  conectado: boolean;
  eventos: EventoImportado[];
  /** id del evento -> dias (YYYY-MM-DD) que ocupa dentro del rango. */
  diasPorEvento: Record<string, string[]>;
}

interface InicioDto {
  auth_url: string;
}

interface EstadoDto {
  conectado: boolean;
}

interface EventoDto {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  todo_el_dia: boolean;
}

interface CalendarioGoogleDto {
  conectado: boolean;
  eventos?: EventoDto[];
  dias?: Record<string, string[]>;
}

/**
 * Pide la URL de consentimiento.
 *
 * El PKCE completo lo maneja el backend: el code_verifier viaja firmado
 * dentro del state (D4) y nunca toca la app. Aca solo se abre el navegador.
 */
export async function iniciarConexion(): Promise<string> {
  const dto = await backendRequest<InicioDto>(`${RUTA_GOOGLE}/oauth/inicio`);
  return dto.auth_url;
}

/** ¿Hay tokens vigentes? Settings lo consulta al abrir y tras conectar. */
export async function consultarEstado(): Promise<boolean> {
  const dto = await backendRequest<EstadoDto>(`${RUTA_GOOGLE}/estado`);
  return dto.conectado;
}

/**
 * Trae los eventos que tocan el rango.
 *
 * Un evento de varios dias vuelve UNA vez con su inicio/fin reales; la
 * expansion por dia ya la hizo el servidor (`dias`) y llega lista para
 * pintar. Desconectado responde 200 con `conectado: false`: es un estado
 * normal, no un error.
 */
export async function cargarEventos(desde: string, hasta: string): Promise<VentanaGoogle> {
  const dto = await backendRequest<CalendarioGoogleDto>(
    `${RUTA_CALENDARIO_GOOGLE}?desde=${desde}&hasta=${hasta}`
  );

  if (!dto.conectado) {
    return { conectado: false, eventos: [], diasPorEvento: {} };
  }

  const eventos: EventoImportado[] = (dto.eventos ?? []).map((e) => ({
    id: e.id,
    titulo: e.titulo,
    inicio: e.inicio,
    fin: e.fin,
    todoElDia: e.todo_el_dia ?? false,
  }));

  return { conectado: true, eventos, diasPorEvento: dto.dias ?? {} };
}

/**
 * Corta la conexion: revoca en Google y borra tokens, eventos y sync_token.
 *
 * Nunca estar conectado tambien es exito: el backend responde 204 igual y
 * para quien llama ambas cosas son "ya no hay conexion".
 */
export async function desconectar(): Promise<void> {
  await backendRequest<void>(`${RUTA_GOOGLE}/oauth`, { method: 'DELETE' });
}
