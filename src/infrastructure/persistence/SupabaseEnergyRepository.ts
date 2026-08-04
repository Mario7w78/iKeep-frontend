import {
  EnergyRecord,
  EnergyRepository,
} from '../../application/ports/out/EnergyRepository';
import { supabase } from '../supabase/client';

/** Se conservan 90 dias: mas atras no describe el presente del usuario. */
const MAX_DAYS = 90;

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export class SupabaseEnergyRepository implements EnergyRepository {
  async save(record: EnergyRecord): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const { error: insertError } = await supabase.from('energy_records').insert({
      user_id: userId,
      timestamp: record.timestamp,
      nivel: record.nivel,
      dia_semana: record.dia_semana,
      contexto: record.contexto ?? null,
    });
    if (insertError) throw insertError;

    // La poda va junto al alta porque no hay nada mas que la dispare.
    const cutoff = new Date(Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: pruneError } = await supabase
      .from('energy_records')
      .delete()
      .eq('user_id', userId)
      .lt('timestamp', cutoff);
    if (pruneError) throw pruneError;
  }

  async history(days: number): Promise<EnergyRecord[]> {
    const userId = await getUserId();
    if (!userId) return [];

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('energy_records')
      .select('timestamp, nivel, dia_semana, contexto')
      .eq('user_id', userId)
      .gt('timestamp', cutoff)
      .order('timestamp', { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row) => ({
      timestamp: row.timestamp,
      nivel: row.nivel,
      dia_semana: row.dia_semana,
      contexto: row.contexto ?? undefined,
    }));
  }

  async reportedToday(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) return false;

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();

    const { count, error } = await supabase
      .from('energy_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', todayStart);
    if (error) throw error;

    return (count ?? 0) > 0;
  }

  async getPatternOverride(): Promise<string | null> {
    const userId = await getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_settings')
      .select('custom_energy_pattern')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    return data?.custom_energy_pattern ?? null;
  }

  async savePatternOverride(pattern: string | null): Promise<void> {
    const userId = await getUserId();
    if (!userId) throw new Error('No hay sesión activa');

    const { error } = await supabase.from('user_settings').upsert({
      user_id: userId,
      custom_energy_pattern: pattern,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}
