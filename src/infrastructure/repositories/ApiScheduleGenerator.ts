import { ScheduleGenerator } from '../../application/ports/out/ScheduleGenerator';
import { Activity } from '../../domain/entities/Activity';
import { Schedule } from '../../domain/entities/Schedule';
import { GenerateScheduleOptions } from '../../application/ports/in/GenerateSchedulePort';
import { ScheduleApiService } from '../api/ScheduleApiService';
import { domainToScheduleRequest, scheduleResponseToDomain } from '../api/mappers/scheduleMapper';

export class ApiScheduleGenerator implements ScheduleGenerator {
  async generate(activities: Activity[], startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule> {
    const requestDto = domainToScheduleRequest(activities, startHour, endHour, options);
    const responseDto = await ScheduleApiService(requestDto);
    return scheduleResponseToDomain(responseDto, activities);
  }
}
