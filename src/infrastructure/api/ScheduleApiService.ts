// scheduleService.ts
import { Activity } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';
import { mapActivitiesForBackend, mapBackendToSchedule } from './mappers/scheduleMapper';

const API_BASE_URL = 'https://ikeep-backend.onrender.com/api/v1/horarios';

export const ScheduleApiService = async (activities: Activity[]): Promise<Schedule> => {
  const response = await fetch(`${API_BASE_URL}/generar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hora_inicio_dia: 0,
      hora_fin_dia: 1439,
      actividades: mapActivitiesForBackend(activities),
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Error al generar el horario');
  }
  const raw: any[] = await response.json();
  return mapBackendToSchedule(raw, activities);  
};