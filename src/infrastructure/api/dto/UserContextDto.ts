export interface BloqueSuenoDto {
  dia: number;
  inicio: number;
  fin: number;
}

export interface EnergyRecordDto {
  /** ISO 8601 datetime when the user reported their energy */
  timestamp: string;
  /** Energy level 1–3 (1=baja, 2=normal, 3=alta) */
  nivel: number;
  /** Day of week: 0=Monday, 6=Sunday */
  dia_semana: number;
  /** Optional context */
  contexto?: string;
}

export interface ContextoUsuarioDto {
  nivel_energia: number;
  horario_inicio: number;
  horario_fin: number;
  bloques_sueno: BloqueSuenoDto[];
  /** Last 14 days of energy history (optional, for pattern detection) */
  historial_energia?: EnergyRecordDto[];
}
