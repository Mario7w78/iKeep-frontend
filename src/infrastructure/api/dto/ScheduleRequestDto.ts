import { ActividadFijaDto, TareaPendienteDto } from './ActivityDto';
import { UbicacionDto } from './LocationDto';
import { TiempoTrasladoDto } from './TravelTimeDto';
import { ContextoUsuarioDto } from './UserContextDto';

export interface ScheduleRequestDto {
  actividades_fijas: ActividadFijaDto[];
  tareas_pendientes: TareaPendienteDto[];
  ubicaciones: UbicacionDto[];
  tiempos_traslado: TiempoTrasladoDto[];
  contexto_usuario: ContextoUsuarioDto;
}
