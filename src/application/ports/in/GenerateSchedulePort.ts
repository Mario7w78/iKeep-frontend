// src/application/ports/in/GenerateSchedulePort.ts
import { Schedule } from '../../../domain/entities/Schedule';

export interface GenerateSchedulePort {
    execute(startHour: number, endHour: number): Promise<Schedule>;
}