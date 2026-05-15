import { DayOfWeek } from "../../../domain/entities/Activity";
import { DayConfig } from "../../../domain/entities/activity.types";

export interface CreateActivityCommand {
  activityName: string;
  isFixed: boolean;
  daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
  days: DayOfWeek[];
}

export interface CreateActivityPort {
    execute({ activityName, isFixed, daysConfig, days }: CreateActivityCommand): Promise<void>
}