import { DayLimitPersistence } from '../store/useScheduleStore';
import { supabase } from '../supabase/client';

async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getSettingsRow(): Promise<Record<string, any> | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertSettings(patch: Record<string, any>): Promise<void> {
  const userId = await getUserId();
  if (!userId) throw new Error('No hay sesión activa');
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export const supabaseDayLimitPersistence: DayLimitPersistence = {
  getStartHour: async () => {
    const row = await getSettingsRow();
    return row?.start_hour ?? 240;
  },

  getEndHour: async () => {
    const row = await getSettingsRow();
    return row?.end_hour ?? 1320;
  },

  setStartHour: async (hour: number) => {
    await upsertSettings({ start_hour: hour });
  },

  setEndHour: async (hour: number) => {
    await upsertSettings({ end_hour: hour });
  },

  getDiaInicio: async () => {
    const row = await getSettingsRow();
    return row?.dia_inicio ?? 0;
  },

  getDiasTotales: async () => {
    const row = await getSettingsRow();
    return row?.dias_totales ?? 7;
  },

  setDiaInicio: async (val: number) => {
    await upsertSettings({ dia_inicio: val });
  },

  setDiasTotales: async (val: number) => {
    await upsertSettings({ dias_totales: val });
  },

  getPerDayStartHours: async () => {
    const row = await getSettingsRow();
    return row?.per_day_start_hours ?? null;
  },

  setPerDayStartHours: async (val: number[] | null) => {
    await upsertSettings({ per_day_start_hours: val });
  },

  getPerDayEndHours: async () => {
    const row = await getSettingsRow();
    return row?.per_day_end_hours ?? null;
  },

  setPerDayEndHours: async (val: number[] | null) => {
    await upsertSettings({ per_day_end_hours: val });
  },
};
