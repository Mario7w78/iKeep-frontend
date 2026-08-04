import { USA_BACKEND_PARA_DATOS } from '../../config/featureFlags';
import { EnergyRecord } from '../../application/ports/out/EnergyRepository';
import { ApiEnergyRepository } from './ApiEnergyRepository';
import { SupabaseEnergyRepository } from './SupabaseEnergyRepository';

/**
 * Fachada del historial de energia.
 *
 * La logica vive ahora en dos adaptadores detras de EnergyRepository; esto
 * queda como punto de entrada porque tres pantallas y un store lo importan
 * como funciones sueltas. Conservar la forma evita tocarlos.
 *
 * Que las pantallas importen infraestructura directamente es un problema
 * aparte —deberia inyectarse por Dependencies como el resto—, pero
 * arreglarlo aca habria mezclado dos cambios sin relacion.
 */

const DEFAULT_HISTORY_DAYS = 14;

const repository = USA_BACKEND_PARA_DATOS
  ? new ApiEnergyRepository()
  : new SupabaseEnergyRepository();

export type { EnergyRecord };

export function saveEnergyRecord(record: EnergyRecord): Promise<void> {
  return repository.save(record);
}

export function getEnergyHistory(
  days: number = DEFAULT_HISTORY_DAYS
): Promise<EnergyRecord[]> {
  return repository.history(days);
}

export function hasReportedEnergyToday(): Promise<boolean> {
  return repository.reportedToday();
}

export function saveEnergyPatternOverride(pattern: string | null): Promise<void> {
  return repository.savePatternOverride(pattern);
}

export function getEnergyPatternOverride(): Promise<string | null> {
  return repository.getPatternOverride();
}

/** Crea un registro para el momento actual. */
export function makeEnergyRecord(nivel: number, contexto?: string): EnergyRecord {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    nivel,
    dia_semana: (now.getDay() + 6) % 7, // JS domingo=0 -> lunes=0
    contexto,
  };
}
