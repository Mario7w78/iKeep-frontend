// src/infrastructure/api/mappers/suggestTaskMapper.ts
import { Activity } from '../../../domain/entities/Activity';
import { TareaPendienteDto } from '../dto/ActivityDto';

export function domainToTareaPendiente(activities: Activity[]): TareaPendienteDto[] {
    return activities.map(act => ({
        id: act.id,
        nombre: act.title,
        tipo: 'tarea',
        dia: 0,
        hora_inicio: 0,
        hora_fin: 0,
        ubicacion_id: 'default',
        prioridad: 5,
        duracion_estimada: act.getTotalTimeRequired(),
        dificultad: 'media',
    }));
}
