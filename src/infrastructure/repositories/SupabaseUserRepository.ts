import { UserRepository } from '../../application/ports/out/UserRepository';
import { User } from '../../domain/entities/User';
import { supabase } from '../supabase/client';

export class SupabaseUserRepository implements UserRepository {
  async get(): Promise<User | null> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    if (error) throw error;

    // El trigger de signup crea la fila de `profiles` solo con el id — hasta
    // que el usuario complete el onboarding, energy_level/wake_up_time/
    // sleep_time son null. `User` valida esos campos estrictamente, así que
    // tratamos "perfil incompleto" igual que "sin perfil" (como AsyncStorage
    // devolvía null si la key no existía).
    if (!data || data.energy_level == null || !data.wake_up_time || !data.sleep_time) {
      return null;
    }

    return new User({
      id: data.id,
      name: data.username ?? '',
      energyLevel: data.energy_level,
      wakeUpTime: data.wake_up_time,
      sleepTime: data.sleep_time,
    });
  }

  async save(user: User): Promise<void> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No hay sesión activa');

    const { error } = await supabase.from('profiles').upsert({
      id: authUser.id,
      username: user.name,
      energy_level: user.energyLevel,
      wake_up_time: user.wakeUpTime,
      sleep_time: user.sleepTime,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  async delete(): Promise<void> {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;

    // No se borra la fila (profiles.id referencia auth.users con cascade y
    // no hay trigger que la recree fuera de un signup nuevo) — se limpian
    // los campos, equivalente a "perfil no guardado" para el resto de la app.
    const { error } = await supabase
      .from('profiles')
      .update({ username: null, energy_level: null, wake_up_time: null, sleep_time: null })
      .eq('id', authUser.id);
    if (error) throw error;
  }
}
