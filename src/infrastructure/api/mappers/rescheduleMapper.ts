// src/infrastructure/api/mappers/rescheduleMapper.ts
import { BloqueTiempoDto } from '../dto/ScheduleResponseDto';
import { Schedule } from '../../../domain/entities/Schedule';

export function scheduleToBloqueTiempo(schedule: Schedule): BloqueTiempoDto[] {
    return schedule.getAllItems().map(item => ({
        id_actividad: item.activity.id,
        nombre: item.activity.title,
        tipo: 'tarea' as const,
        dia: ['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].indexOf(item.day),
        hora_inicio: parseInt(item.assignedStartTime.split(':')[0]) * 60 + parseInt(item.assignedStartTime.split(':')[1]),
        hora_fin: parseInt(item.assignedEndTime.split(':')[0]) * 60 + parseInt(item.assignedEndTime.split(':')[1]),
        ubicacion_id: 'default',
    }));
}
