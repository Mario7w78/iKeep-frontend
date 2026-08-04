import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { Activity, ActivityType, DayOfWeek } from '../../domain/entities/Activity';
import { backendRequest } from '../api/backendClient';
import { restoreDaysConfig } from './daysConfigMapper';

/**
 * Actividades a traves del backend en vez de directo a Supabase.
 *
 * Implementa el mismo puerto que SupabaseActivityRepository, asi que los
 * casos de uso y los stores no se enteran del cambio: se sustituye en
 * Dependencies.ts y nada mas se toca.
 *
 * El contrato JSON es el mismo que ya usaba la tabla —`days_enabled`,
 * `is_anchor`— porque el backend expone los nombres que la app ya manejaba.
 */

const RUTA = '/api/v1/actividades';

interface ActivityDto {
  id: string;
  user_id?: string;
  title: string;
  type: string;
  identity?: string;
  priority?: number;
  difficulty?: string;
  deadline?: string | null;
  days_enabled?: any[];
  days_config?: Record<string, any> | null;
  optional_day?: boolean;
  day_from?: number | null;
  day_to?: number | null;
  is_anchor?: boolean;
}

function dtoToActivity(dto: ActivityDto): Activity {
  return new Activity({
    id: String(dto.id),
    title: dto.title,
    type: dto.type as ActivityType,
    identity: (dto.identity ?? 'tarea') as any,
    priority: dto.priority ?? 3,
    difficulty: (dto.difficulty ?? 'media') as any,
    deadline: dto.deadline ?? null,
    daysEnabled: (dto.days_enabled ?? []) as DayOfWeek[],
    // Las horas viajan como texto ISO dentro del JSON; el dominio las quiere
    // como Date. Se reutiliza la misma restauracion que ya usaba la lectura
    // directa de Supabase para que las dos rutas no puedan divergir.
    daysConfig: restoreDaysConfig(dto.days_config),
    optionalDay: dto.optional_day ?? false,
    dayFrom: dto.day_from ?? undefined,
    dayTo: dto.day_to ?? undefined,
    isAnchor: dto.is_anchor ?? false,
  });
}

function activityToDto(activity: Activity): Omit<ActivityDto, 'user_id'> {
  // Sin user_id a proposito: lo determina el servidor a partir del token.
  // Mandarlo desde el cliente seria un dato que el backend tendria que
  // ignorar, y algo que se ignora termina pareciendo que se respeta.
  return {
    id: String(activity.id),
    title: activity.title,
    type: activity.type,
    identity: activity.identity,
    priority: activity.priority,
    difficulty: activity.difficulty,
    deadline: activity.deadline,
    days_enabled: activity.daysEnabled,
    days_config: activity.daysConfig,
    optional_day: activity.optionalDay ?? false,
    day_from: activity.dayFrom ?? null,
    day_to: activity.dayTo ?? null,
    is_anchor: activity.isAnchor ?? false,
  };
}

export class ApiActivityRepository implements ActivityRepository {
  async getAll(): Promise<Activity[]> {
    const dtos = await backendRequest<ActivityDto[]>(RUTA);
    return (dtos ?? []).map(dtoToActivity);
  }

  async save(activity: Activity): Promise<void> {
    await backendRequest<ActivityDto>(`${RUTA}/${activity.id}`, {
      method: 'PUT',
      body: activityToDto(activity),
    });
  }

  async delete(id: string): Promise<void> {
    await backendRequest<void>(`${RUTA}/${String(id)}`, { method: 'DELETE' });
  }
}
