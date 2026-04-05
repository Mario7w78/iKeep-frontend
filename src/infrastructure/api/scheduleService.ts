// src/infrastructure/api/scheduleService.ts
import { Activity } from '../../domain/entities/Activity';
import { mapActivitiesForBackend } from '../../application/mappers/scheduleMapper';

const API_BASE_URL = 'http://TU_IP_LOCAL:8000/api/v1/horarios'; // Usa la IP de tu PC, no localhost

export const generateSmartSchedule = async (activities: Activity[]) => {
    try {
        const backendPayload = {
            hora_inicio_dia: 480, // Ej: 8:00 AM (8 * 60)
            hora_fin_dia: 1320,   // Ej: 10:00 PM (22 * 60)
            actividades: mapActivitiesForBackend(activities)
        };

        const response = await fetch(`${API_BASE_URL}/generar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backendPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al generar el horario');
        }

        const scheduledActivities = await response.json();
        return scheduledActivities;

    } catch (error) {
        console.error('Error en generateSmartSchedule:', error);
        throw error;
    }
};