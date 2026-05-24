export type BackendActivityType = 'clase' | 'trabajo' | 'tarea' | 'examen' | 'reunion' | 'descanso' | 'viaje';
export type BackendDifficulty = 'baja' | 'media' | 'alta';

export interface ActividadFijaDto {
  id: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string;
  prioridad: number;
  duracion_estimada: number;
  dificultad: BackendDifficulty;
}

export interface TareaPendienteDto {
  id: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string;
  prioridad: number;
  duracion_estimada: number;
  dificultad: BackendDifficulty;
}
