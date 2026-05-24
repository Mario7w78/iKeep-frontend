import { ScheduleResponseDto } from './ScheduleResponseDto';
import { ContextoUsuarioDto } from './UserContextDto';

export interface RescheduleRequestDto {
  horario_actual: ScheduleResponseDto;
  actividad_afectada_id: string;
  tiempo_perdido_minutos: number;
  contexto_usuario: ContextoUsuarioDto;
}
