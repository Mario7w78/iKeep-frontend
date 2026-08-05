/**
 * Tipos de la conversación con el asistente.
 *
 * El backend es stateless: el borrador y los turnos viajan en cada petición y
 * vuelven en cada respuesta. Sostener conversaciones en memoria del servidor
 * no sobreviviría a que Render duerma el contenedor.
 */

export interface BloqueHorario {
  day: string;
  /** Minutos desde medianoche. 600 son las 10:00. */
  start_time: number;
  end_time: number;
}

/**
 * Lo que se sabe de la actividad hasta este punto de la conversación.
 *
 * Es la memoria del asistente. Sus campos reflejan los de ParseNLResponseDto
 * a propósito, para que `mapParsedResponseToFormState` sirva sin traducciones
 * intermedias.
 */
export interface Borrador {
  name?: string | null;
  activity_type?: 'clase' | 'trabajo' | 'tarea' | 'viaje' | null;
  is_fixed?: boolean | null;
  is_anchor?: boolean;
  difficulty?: 'baja' | 'media' | 'alta' | null;
  priority?: 'baja' | 'media' | 'alta' | null;
  schedule?: BloqueHorario[];
  duracion_minutos?: number | null;
  hora_preferida_inicio?: number | null;
  hora_preferida_fin?: number | null;
  deadline?: string | null;
  location?: string | null;
  travel_to?: number | null;
  travel_from?: number | null;
}

/**
 * Un turno en el formato nativo del modelo.
 *
 * Se guarda y reenvía **verbatim**, sin interpretarlo: las invocaciones y sus
 * resultados tienen que volver al modelo tal como los emitió. Ese es
 * exactamente el arreglo del "se olvida" —recibir de vuelta su propio JSON
 * estructurado en vez de una paráfrasis en prosa— y parsearlo aquí lo
 * desharía.
 */
export interface LlmTurno {
  role: 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
}

export type TipoPropuesta = 'crear' | 'modificar' | 'eliminar' | 'regenerar';

export interface Propuesta {
  tipo: TipoPropuesta;
  borrador?: Borrador | null;
  /** Solo en modificar y eliminar: sin id no hay nada que señalar. */
  activity_id?: string | null;
}

export interface RespuestaAsistente {
  tipo: 'pregunta' | 'charla' | 'propuesta';
  mensaje?: string | null;
  borrador: Borrador;
  turnos: LlmTurno[];
  propuesta?: Propuesta | null;
}

export interface PeticionAsistente {
  mensaje: string;
  borrador?: Borrador;
  turnos?: LlmTurno[];
  ya_pregunte?: string[];
  energia?: string | null;
}
