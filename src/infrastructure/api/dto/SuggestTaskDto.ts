import { TareaPendienteDto, BackendActivityType, BackendDifficulty } from './ActivityDto';

export interface SugerirTareaRequestDto {
  tiempo_libre_minutos: number;
  tareas_pendientes: TareaPendienteDto[];
  dia_preferido?: number;
}

export interface SugerenciaTareaDto {
  id_actividad: string;
  nombre: string;
  tipo: BackendActivityType;
  duracion_estimada: number;
  dificultad: BackendDifficulty;
  prioridad: number;
  encaja: boolean;
  razon: string;
}

export interface SugerirTareaResponseDto {
  sugerencias: SugerenciaTareaDto[];
}
