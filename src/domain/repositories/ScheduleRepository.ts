import { Activity } from '../entities/Activity';
import { Schedule } from '../entities/Schedule';
export interface ScheduleRepository {
    generate(activities: Activity[]): Promise<Schedule>;
}