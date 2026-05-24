import { Activity } from '../../../domain/entities/Activity';
import { Schedule } from '../../../domain/entities/Schedule';
import { GenerateScheduleOptions } from '../in/GenerateSchedulePort';

export interface ScheduleGenerator {
    generate(activities: Activity[], startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule>;
}
