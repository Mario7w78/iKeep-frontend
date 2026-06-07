// src/application/ports/in/GenerateSchedulePort.ts
import { Schedule } from '../../../domain/entities/Schedule';
import { BloqueSuenoDto, EnergyRecordDto } from '../../../infrastructure/api/dto/UserContextDto';
import { UbicacionDto } from '../../../infrastructure/api/dto/LocationDto';
import { TiempoTrasladoDto } from '../../../infrastructure/api/dto/TravelTimeDto';

export interface GenerateScheduleOptions {
  nivel_energia?: number;
  bloques_sueno?: BloqueSuenoDto[];
  ubicaciones?: UbicacionDto[];
  tiempos_traslado?: TiempoTrasladoDto[];
  /** Last 14 days of energy history for pattern detection */
  historial_energia?: EnergyRecordDto[];
  /** Rolling week start day (0=Monday, default 0) */
  dia_inicio?: number;
  /** Rolling week duration in days (default 7) */
  dias_totales?: number;
  /** Manual energy pattern override */
  patron_energia_manual?: string;
  /** Per-day start hours override (7 values, one per day) */
  perDayStartHours?: number[];
  /** Per-day end hours override (7 values, one per day) */
  perDayEndHours?: number[];
}

export interface GenerateSchedulePort {
    execute(startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule>;
}