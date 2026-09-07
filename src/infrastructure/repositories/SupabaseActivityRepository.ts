import { comoArea } from '../../domain/entities/lifeArea';
import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { Activity, ActivityType, DayOfWeek } from '../../domain/entities/Activity';
import { DayConfig } from '../../domain/entities/activity.types';
import { supabase } from '../supabase/client';
import { restoreDaysConfig } from './daysConfigMapper';

// Se re-exporta porque varios modulos ya la importaban desde aca.
export { restoreDaysConfig };


function rowToActivity(row: any): Activity {
  return new Activity({
    id: String(row.id),
    title: row.title,
    type: row.type as ActivityType,
    area: comoArea(row.area),
    identity: row.identity ?? 'tarea',
    priority: row.priority ?? 3,
    difficulty: row.difficulty ?? 'media',
    deadline: row.deadline ?? null,
    daysEnabled: row.days_enabled ?? [],
    daysConfig: restoreDaysConfig(row.days_config),
    optionalDay: row.optional_day ?? false,
    dayFrom: row.day_from ?? undefined,
    dayTo: row.day_to ?? undefined,
    isAnchor: row.is_anchor ?? false,
    description: row.description ?? null,
  });
}

function activityToRow(activity: Activity, userId: string) {
  return {
    id: String(activity.id),
    user_id: userId,
    title: activity.title,
    type: activity.type,
    description: activity.description,
    area: activity.area,
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

export class SupabaseActivityRepository implements ActivityRepository {
  async getAll(): Promise<Activity[]> {
    const { data, error } = await supabase.from('activities').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToActivity);
  }

  async save(activity: Activity): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No hay sesión activa');

    const { error } = await supabase.from('activities').upsert(activityToRow(activity, user.id));
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('activities').delete().eq('id', String(id));
    if (error) throw error;
  }
}
