import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ikeep/energy_history';
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

async function loadAll(): Promise<EnergyRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveAll(records: EnergyRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** Save a new entry and prune records older than 90 days. */
export async function saveEnergyRecord(record: EnergyRecord): Promise<void> {
  const history = await loadAll();
  history.push(record);

  const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  const pruned = history.filter(
    (e) => new Date(e.timestamp).getTime() > cutoff,
  );

  await saveAll(pruned);
}

/** Return the last `days` of energy history, sorted newest-first. */
export async function getEnergyHistory(
  days: number = DEFAULT_HISTORY_DAYS,
): Promise<EnergyRecord[]> {
  const history = await loadAll();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return history.filter((e) => new Date(e.timestamp).getTime() > cutoff);
}

/** Check if the user already reported energy today. */
export async function hasReportedEnergyToday(): Promise<boolean> {
  const history = await loadAll();
  if (history.length === 0) return false;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  return history.some(
    (e) => new Date(e.timestamp).getTime() >= todayStart,
  );
}

/** Create an EnergyRecord for the current moment. */
export function makeEnergyRecord(
  nivel: number,
  contexto?: string,
): EnergyRecord {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    nivel,
    dia_semana: (now.getDay() + 6) % 7, // Convert: JS Sunday=0 → Monday=0
    contexto,
  };
}
