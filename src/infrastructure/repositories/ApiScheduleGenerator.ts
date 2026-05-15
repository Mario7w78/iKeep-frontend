import { ScheduleGenerator } from '../../application/ports/out/ScheduleGenerator';
import { Activity } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleApiService } from '../api/ScheduleApiService';

export class ApiScheduleGenerator implements ScheduleGenerator {
  async generate(activities: Activity[], startHour: number, endHour: number): Promise<Schedule> {
    return await ScheduleApiService(activities, startHour, endHour);
  }
}