import { BackendActivityType } from './ActivityDto';

export type ScheduleEstado = 'OPTIMA' | 'FACTIBLE' | 'INFACTIBLE' | 'DESCONOCIDO';

export interface BloqueTiempoDto {
  id_actividad: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string | null;
  /**
   * Si su hora está clavada. Es lo único que el backend mira para decidir si
   * puede moverla al replanificar: preguntar por el rótulo —"¿es una
   * clase?"— le reubicaba a la gente el turno de trabajo.
   *
   * Opcional solo porque un horario guardado antes de que el campo existiera
   * llega sin él; el servidor lo detecta y aplica la regla vieja. Al MANDAR
   * siempre va con valor.
   */
  es_fija?: boolean;
}

export interface ScheduleResponseDto {
  estado: ScheduleEstado;
  bloques: BloqueTiempoDto[];
  mensaje: string;
  recomendaciones?: string[];
  tareas_omitidas?: string[];
}
