import { DayOfWeek } from "../../../domain/entities/Activity";

export interface CreateActivityCommand {
  activityName: string;
  isFixed: boolean;
  startTime: Date;
  endTime: Date;
  durationTime: number;
  travelTime: number;
  days: DayOfWeek[];
}

export interface CreateActivityPort {
    execute({ activityName, isFixed, startTime, endTime, durationTime, travelTime, days }: CreateActivityCommand): Promise<void>
}