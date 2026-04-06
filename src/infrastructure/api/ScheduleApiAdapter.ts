// src/infrastructure/api/scheduleService.ts
import { Activity } from '../../domain/entities/Activity';
import { mapActivitiesForBackend } from '../../application/mappers/scheduleMapper';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/horarios';

export const ScheduleApiAdapter = async (activities: Activity[]) => {
    const backendPayload = {
        hora_inicio_dia: 0,
        hora_fin_dia: 1439,
        actividades: mapActivitiesForBackend(activities)
    };

    const response = await fetch(`${API_BASE_URL}/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al generar el horario');
    }

    const actividades = await response.json(); // el backend devuelve el array directo

    return { actividades }; 
};