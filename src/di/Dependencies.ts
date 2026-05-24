import { GenerateSchedulePort } from '../application/ports/in/GenerateSchedulePort';
import { CreateActivityPort } from '../application/ports/in/CreateActivityPort';
import { DeleteActivityPort } from '../application/ports/in/DeleteActivityPort';
import { GetActivityPort } from '../application/ports/in/GetActivityPort';
import { ReschedulePort } from '../application/ports/in/ReschedulePort';
import { SuggestTaskPort } from '../application/ports/in/SuggestTaskPort';
import { ActivityRepository } from '../application/ports/out/ActivityRepository';
import { ScheduleGenerator } from '../application/ports/out/ScheduleGenerator';
import { RescheduleGenerator } from '../application/ports/out/RescheduleGenerator';
import { TaskSuggester } from '../application/ports/out/TaskSuggester';

import { AsyncStorageActivityRepository } from '../infrastructure/repositories/AsyncStorageActivityRepository';
import { ApiScheduleGenerator } from '../infrastructure/repositories/ApiScheduleGenerator';
import { ApiRescheduleGenerator } from '../infrastructure/repositories/ApiRescheduleGenerator';
import { ApiTaskSuggester } from '../infrastructure/repositories/ApiTaskSuggester';

import { GenerateScheduleUseCase } from '../application/use-cases/GenerateScheduleUseCase';
import { CreateActivityUseCase } from '../application/use-cases/CreateActivityUseCase';
import { DeleteActivityUseCase } from '../application/use-cases/DeleteActivityUseCase';
import { GetActivityUseCase } from '../application/use-cases/GetActivityUseCase';
import { RescheduleUseCase } from '../application/use-cases/RescheduleUseCase';
import { SuggestTaskUseCase } from '../application/use-cases/SuggestTaskUseCase';

import { createActivityStore, ActivityStore } from '../infrastructure/store/useActivityStore';
import { createScheduleStore, ScheduleStore } from '../infrastructure/store/useScheduleStore';
import { asyncStorageDayLimitPersistence } from '../infrastructure/persistence/AsyncStorageDayLimitPersistence';

const activityRepository: ActivityRepository = new AsyncStorageActivityRepository();
const scheduleGenerator: ScheduleGenerator = new ApiScheduleGenerator();
const rescheduleGenerator: RescheduleGenerator = new ApiRescheduleGenerator();
const taskSuggester: TaskSuggester = new ApiTaskSuggester();

export const generateScheduleUseCase: GenerateSchedulePort = new GenerateScheduleUseCase(
  scheduleGenerator,
  activityRepository
);
export const createActivityUseCase: CreateActivityPort = new CreateActivityUseCase(activityRepository);
export const deleteActivityUseCase: DeleteActivityPort = new DeleteActivityUseCase(activityRepository);
export const getActivityUseCase: GetActivityPort = new GetActivityUseCase(activityRepository);
export const rescheduleUseCase: ReschedulePort = new RescheduleUseCase(
  rescheduleGenerator,
  activityRepository
);
export const suggestTaskUseCase: SuggestTaskPort = new SuggestTaskUseCase(
  taskSuggester,
  activityRepository
);

export const useActivityStore: ActivityStore = createActivityStore(
  getActivityUseCase,
  createActivityUseCase,
  deleteActivityUseCase
);

export const useScheduleStore: ScheduleStore = createScheduleStore(
  generateScheduleUseCase,
  asyncStorageDayLimitPersistence,
  rescheduleUseCase,
  suggestTaskUseCase
);
