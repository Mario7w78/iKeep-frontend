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

/**
 * Historial de energia del usuario y su patron manual.
 *
 * El patron se guarda junto a los ajustes y no con los registros, pero se
 * expone aca porque para la app es una sola cosa: como distribuir el esfuerzo
 * a lo largo del dia. Donde vive cada campo es un detalle del adaptador.
 */
export interface EnergyRepository {
  save(record: EnergyRecord): Promise<void>;
  history(days: number): Promise<EnergyRecord[]>;
  reportedToday(): Promise<boolean>;
  getPatternOverride(): Promise<string | null>;
  savePatternOverride(pattern: string | null): Promise<void>;
}
