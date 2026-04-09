import { GenerateSchedulePort } from '../application/ports/in/GenerateSchedulePort';
import { CreateActivityPort } from '../application/ports/in/CreateActivityPort'
import { DeleteActivityPort } from '../application/ports/in/DeleteActivityPort';
import { GetActivityPort } from '../application/ports/in/GetActivityPort';

import { AsyncStorageActivityRepository } from '../infrastructure/repositories/AsyncStorageActivityRepository';
import { ApiScheduleRepository } from '../infrastructure/repositories/APIScheduleRepository';

import { GenerateScheduleUseCase } from '../application/use-cases/GenerateScheduleUseCase';
import { CreateActivityUseCase } from '../application/use-cases/CreateActivityUseCase';
import { DeleteActivityUseCase } from '../application/use-cases/DeleteActivityUseCase';
import { GetActivityUseCase } from '../application/use-cases/GetActivityUseCase';


const activityRepository = new AsyncStorageActivityRepository();
const scheduleRepository = new ApiScheduleRepository();

export const generateScheduleUseCase: GenerateSchedulePort = new GenerateScheduleUseCase(
    scheduleRepository,
    activityRepository
);
export const createActivityUseCase: CreateActivityPort = new CreateActivityUseCase( activityRepository )
export const deleteActivityUseCase: DeleteActivityPort = new DeleteActivityUseCase( activityRepository )
export const getActivityUseCase: GetActivityPort = new GetActivityUseCase( activityRepository )