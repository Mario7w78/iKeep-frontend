/**
 * El horario vigente del usuario, tal como viaja hacia y desde el servidor.
 *
 * Se usa la forma cruda y no la entidad Schedule a proposito: `scheduled
 * activities` es la salida del solver, y darle forma de dominio en este
 * puerto obligaria a los dos adaptadores a repetir la misma reconstruccion.
 * El store la arma una sola vez, donde ya lo hacia.
 */
export interface ScheduleSnapshot {
  id?: string;
  user_id?: string;
  created_at?: string | null;
  estado?: string | null;
  mensaje?: string | null;
  recomendaciones?: any[];
  tareas_omitidas?: any[];
  scheduled_activities?: any[];
}

export interface SchedulePersistence {
  /** El horario guardado, o null si el usuario no genero ninguno. */
  load(): Promise<ScheduleSnapshot | null>;
  save(snapshot: ScheduleSnapshot): Promise<void>;
  clear(): Promise<void>;
}
