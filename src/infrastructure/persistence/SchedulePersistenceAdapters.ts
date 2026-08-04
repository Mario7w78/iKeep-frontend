import {
  SchedulePersistence,
  ScheduleSnapshot,
} from '../../application/ports/out/SchedulePersistence';
import { USA_BACKEND_PARA_DATOS } from '../../config/featureFlags';
import { backendRequest } from '../api/backendClient';
import { supabase } from '../supabase/client';

/**
 * Persistencia del horario vigente, por Supabase directo o por el backend.
 *
 * Estaba incrustada dentro de useScheduleStore como llamadas sueltas a
 * supabase. Se extrae para poder cambiarla sin tocar el store, igual que el
 * resto de los adaptadores.
 */

const RUTA = '/api/v1/horario';

class SupabaseSchedulePersistence implements SchedulePersistence {
  async load(): Promise<ScheduleSnapshot | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    return data ?? null;
  }

  async save(snapshot: ScheduleSnapshot): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Sin `id`: Postgres es dueño del suyo y el conflicto va por user_id.
    const { error } = await supabase
      .from('schedules')
      .upsert({ ...snapshot, user_id: user.id }, { onConflict: 'user_id' });
    if (error) throw error;
  }

  async clear(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('user_id', user.id);
    if (error) throw error;
  }
}

class ApiSchedulePersistence implements SchedulePersistence {
  async load(): Promise<ScheduleSnapshot | null> {
    const dto = await backendRequest<ScheduleSnapshot>(RUTA);

    // El backend responde 200 con un horario vacio cuando no hay ninguno, en
    // vez de 404: para una cuenta nueva eso es lo normal, no un error. Aca se
    // traduce a null, que es lo que el store ya sabia interpretar.
    if (!dto || !dto.scheduled_activities?.length) return null;

    return dto;
  }

  async save(snapshot: ScheduleSnapshot): Promise<void> {
    await backendRequest(RUTA, {
      method: 'PUT',
      body: {
        estado: snapshot.estado ?? null,
        mensaje: snapshot.mensaje ?? null,
        recomendaciones: snapshot.recomendaciones ?? [],
        tareas_omitidas: snapshot.tareas_omitidas ?? [],
        scheduled_activities: snapshot.scheduled_activities ?? [],
      },
    });
  }

  async clear(): Promise<void> {
    await backendRequest(RUTA, { method: 'DELETE' });
  }
}

export const schedulePersistence: SchedulePersistence = USA_BACKEND_PARA_DATOS
  ? new ApiSchedulePersistence()
  : new SupabaseSchedulePersistence();
