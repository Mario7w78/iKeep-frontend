import { GenerateSchedulePort } from '../application/ports/in/GenerateSchedulePort';
import { CreateActivityPort } from '../application/ports/in/CreateActivityPort';
import { DeleteActivityPort } from '../application/ports/in/DeleteActivityPort';
import { GetActivityPort } from '../application/ports/in/GetActivityPort';
import { GetUserUseCase } from '../application/ports/in/GetUserUseCase';
import { UpdateUserUseCase } from '../application/ports/in/UpdateUserUseCase';
import { ReschedulePort } from '../application/ports/in/ReschedulePort';
import { SuggestTaskPort } from '../application/ports/in/SuggestTaskPort';
import { ActivityRepository } from '../application/ports/out/ActivityRepository';
import { UserRepository } from '../application/ports/out/UserRepository';
import { ScheduleGenerator } from '../application/ports/out/ScheduleGenerator';
import { RescheduleGenerator } from '../application/ports/out/RescheduleGenerator';
import { TaskSuggester } from '../application/ports/out/TaskSuggester';
import { NotificationScheduler } from '../application/ports/out/NotificationScheduler';

import { SupabaseActivityRepository } from '../infrastructure/repositories/SupabaseActivityRepository';
import { ApiActivityRepository } from '../infrastructure/repositories/ApiActivityRepository';
import { CachedActivityRepository } from '../infrastructure/repositories/CachedActivityRepository';
import { SupabaseUserRepository } from '../infrastructure/repositories/SupabaseUserRepository';
import { ApiScheduleGenerator } from '../infrastructure/repositories/ApiScheduleGenerator';
import { ApiRescheduleGenerator } from '../infrastructure/repositories/ApiRescheduleGenerator';
import { ApiTaskSuggester } from '../infrastructure/repositories/ApiTaskSuggester';
import { ExpoNotificationScheduler } from '../infrastructure/notifications/ExpoNotificationScheduler';

import { GenerateScheduleUseCase } from '../application/use-cases/GenerateScheduleUseCase';
import { CreateActivityUseCase } from '../application/use-cases/CreateActivityUseCase';
import { DeleteActivityUseCase } from '../application/use-cases/DeleteActivityUseCase';
import { GetActivityUseCase } from '../application/use-cases/GetActivityUseCase';
import { GetUserUseCaseImpl } from '../application/use-cases/GetUserUseCaseImpl';
import { UpdateUserUseCaseImpl } from '../application/use-cases/UpdateUserUseCaseImpl';
import { RescheduleUseCase } from '../application/use-cases/RescheduleUseCase';
import { SuggestTaskUseCase } from '../application/use-cases/SuggestTaskUseCase';

import { createActivityStore, ActivityStore } from '../infrastructure/store/useActivityStore';
import { createScheduleStore, ScheduleStore } from '../infrastructure/store/useScheduleStore';
import { createUserStore, UserStore } from '../infrastructure/store/useUserStore';
import { supabaseDayLimitPersistence } from '../infrastructure/persistence/SupabaseDayLimitPersistence';
import { conversarConAsistente } from '../infrastructure/api/AssistantApiService';
import { createChatStore, ChatStore } from '../infrastructure/store/useChatStore';
import { USA_BACKEND_PARA_DATOS } from '../config/featureFlags';
import { ApiUserRepository } from '../infrastructure/repositories/ApiUserRepository';
import { apiDayLimitPersistence } from '../infrastructure/persistence/ApiDayLimitPersistence';

// Se re-exporta porque el flag se leia desde aca antes de tener su modulo.
export { USA_BACKEND_PARA_DATOS };


// La cache solo envuelve al camino por el backend. Con Supabase directo no
// hace falta: responde en ~100ms y una copia local solo agregaria una forma
// de mostrar datos viejos sin ninguna espera que ahorrar.
const activityRepository: ActivityRepository = USA_BACKEND_PARA_DATOS
  ? new CachedActivityRepository(new ApiActivityRepository())
  : new SupabaseActivityRepository();
const userRepository: UserRepository = USA_BACKEND_PARA_DATOS
  ? new ApiUserRepository()
  : new SupabaseUserRepository();
const dayLimitPersistence = USA_BACKEND_PARA_DATOS
  ? apiDayLimitPersistence
  : supabaseDayLimitPersistence;
const scheduleGenerator: ScheduleGenerator = new ApiScheduleGenerator();
const rescheduleGenerator: RescheduleGenerator = new ApiRescheduleGenerator();
const taskSuggester: TaskSuggester = new ApiTaskSuggester();
export const notificationScheduler: NotificationScheduler = new ExpoNotificationScheduler();

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

export const getUserUseCase: GetUserUseCase = new GetUserUseCaseImpl(userRepository);
export const updateUserUseCase: UpdateUserUseCase = new UpdateUserUseCaseImpl(userRepository);

export const useActivityStore: ActivityStore = createActivityStore(
  getActivityUseCase,
  createActivityUseCase,
  deleteActivityUseCase
);

export const useScheduleStore: ScheduleStore = createScheduleStore(
  generateScheduleUseCase,
  dayLimitPersistence,
  activityRepository,
  rescheduleUseCase,
  suggestTaskUseCase,
  notificationScheduler
);

export const useUserStore: UserStore = createUserStore(
  getUserUseCase,
  updateUserUseCase
);

export const useChatStore: ChatStore = createChatStore(
  useActivityStore,
  useScheduleStore,
  // El motor conversacional se inyecta para poder probar el store sin red.
  conversarConAsistente
);
