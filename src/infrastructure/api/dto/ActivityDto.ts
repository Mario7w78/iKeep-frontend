export type BackendActivityType = 'clase' | 'trabajo' | 'tarea' | 'viaje';
export type BackendDifficulty = 'baja' | 'media' | 'alta';

export interface ActividadFijaDto {
  id: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string | null;
  prioridad: number;
  duracion_estimada: number;
  fecha_limite: string | null;
  dificultad: BackendDifficulty;
}

export interface TareaPendienteDto {
  id: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string | null;
  prioridad: number;
  duracion_estimada: number;
  fecha_limite: string | null;
  dificultad: BackendDifficulty;
  hora_preferida_inicio?: number | null;
  hora_preferida_fin?: number | null;
}
