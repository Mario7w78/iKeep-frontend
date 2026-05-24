// src/application/ports/in/GenerateSchedulePort.ts
import { Schedule } from '../../../domain/entities/Schedule';
import { BloqueSuenoDto } from '../../../infrastructure/api/dto/UserContextDto';
import { UbicacionDto } from '../../../infrastructure/api/dto/LocationDto';
import { TiempoTrasladoDto } from '../../../infrastructure/api/dto/TravelTimeDto';

export interface GenerateScheduleOptions {
  nivel_energia?: number;
  bloques_sueno?: BloqueSuenoDto[];
  ubicaciones?: UbicacionDto[];
  tiempos_traslado?: TiempoTrasladoDto[];
}

export interface GenerateSchedulePort {
    execute(startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule>;
}