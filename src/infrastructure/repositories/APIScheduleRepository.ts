// ApiScheduleRepository.ts
import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { Activity } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';
import { ScheduleApiService } from '../api/ScheduleApiService';

export class ApiScheduleRepository implements ScheduleRepository {
  async generate(activities: Activity[], startHour: number, endHour: number): Promise<Schedule> {
    return await ScheduleApiService(activities, startHour, endHour);
  }
}