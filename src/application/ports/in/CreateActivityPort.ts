import { AreaDeVida } from '../../../domain/entities/lifeArea';
import { DayOfWeek } from "../../../domain/entities/Activity";
import { DayConfig } from "../../../domain/entities/activity.types";

export interface CreateActivityCommand {
  id?: string;
  activityName: string;
  isFixed: boolean;
  /** De qué parte de tu vida es. Ver `lifeArea`. */
  area?: AreaDeVida;
  identity: "clase" | "trabajo" | "tarea";
  priority: number;
  difficulty: "baja" | "media" | "alta";
  deadline: string | null;
  daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
  days: DayOfWeek[];
  preferredStartTime?: number | null;
  preferredEndTime?: number | null;
  optionalDay?: boolean;
  dayFrom?: number;
  dayTo?: number;
  isAnchor?: boolean;
  /** Fecha puntual `YYYY-MM-DD` (evento de un solo día); null si se repite. */
  fechaUnica?: string | null;
  /** Nota libre de la persona; null o ausente = sin descripción. */
  description?: string | null;
}

export interface CreateActivityPort {
    execute({ activityName, isFixed, daysConfig, days }: CreateActivityCommand): Promise<void>
}