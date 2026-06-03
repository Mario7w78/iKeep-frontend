import { BackendActivityType } from './ActivityDto';

export type ScheduleEstado = 'OPTIMA' | 'FACTIBLE';

export interface BloqueTiempoDto {
  id_actividad: string;
  nombre: string;
  tipo: BackendActivityType;
  dia: number;
  hora_inicio: number;
  hora_fin: number;
  ubicacion_id: string | null;
}

export interface ScheduleResponseDto {
  estado: ScheduleEstado;
  bloques: BloqueTiempoDto[];
  mensaje: string;
}
