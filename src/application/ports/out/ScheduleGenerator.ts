import { Activity } from '../../../domain/entities/Activity';
import { Schedule } from '../../../domain/entities/Schedule';

export interface ScheduleGenerator {
    generate(activities: Activity[], startHour: number, endHour: number): Promise<Schedule>;
}
