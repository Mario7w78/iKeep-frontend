import { supabase } from '../supabase/client';

const MAX_DAYS = 90;
const DEFAULT_HISTORY_DAYS = 14;

export interface EnergyRecord {
  /** ISO 8601 datetime when the user reported their energy */
  timestamp: string;
  /** Energy level 1–3 (1=baja, 2=normal, 3=alta) */
  nivel: number;
  /** Day of week: 0=Monday, 6=Sunday (derived from timestamp) */
  dia_semana: number;
  /** Optional context the user can provide */
  contexto?: string;
}

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Save a new entry and prune records older than 90 days. */
export async function saveEnergyRecord(record: EnergyRecord): Promise<void> {
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

  const cutoff = new Date(Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: pruneError } = await supabase
    .from('energy_records')
    .delete()
    .eq('user_id', userId)
    .lt('timestamp', cutoff);
  if (pruneError) throw pruneError;
}

/** Return the last `days` of energy history, sorted newest-first. */
export async function getEnergyHistory(days: number = DEFAULT_HISTORY_DAYS): Promise<EnergyRecord[]> {
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

/** Check if the user already reported energy today. */
export async function hasReportedEnergyToday(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const { count, error } = await supabase
    .from('energy_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', todayStart);
  if (error) throw error;

  return (count ?? 0) > 0;
}

/** Save the user's manual energy pattern override (null to clear). */
export async function saveEnergyPatternOverride(pattern: string | null): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión activa');

  const { error } = await supabase.from('user_settings').upsert({
    user_id: userId,
    custom_energy_pattern: pattern,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Load the user's manual energy pattern override, or null if not set. */
export async function getEnergyPatternOverride(): Promise<string | null> {
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

/** Create an EnergyRecord for the current moment. */
export function makeEnergyRecord(nivel: number, contexto?: string): EnergyRecord {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    nivel,
    dia_semana: (now.getDay() + 6) % 7, // Convert: JS Sunday=0 → Monday=0
    contexto,
  };
}
