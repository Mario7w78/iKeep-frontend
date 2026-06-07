import { DayOfWeek } from "../../../domain/entities/Activity";
import { DayConfig } from "../../../domain/entities/activity.types";

export interface CreateActivityCommand {
  id?: string;
  activityName: string;
  isFixed: boolean;
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
}

export interface CreateActivityPort {
    execute({ activityName, isFixed, daysConfig, days }: CreateActivityCommand): Promise<void>
}