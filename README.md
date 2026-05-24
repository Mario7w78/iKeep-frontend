# ikeep-app — Arquitectura Hexagonal (Ports & Adapters)

```
┌───────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                                  │
│                   (React Native — Screens, Atoms, Hooks)              │
│                                                                       │
│   ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐        │
│   │ ActivityList  │  │ ScheduleView │  │ SettingsView      │        │
│   └───────┬───────┘  └──────┬───────┘  └───────────────────┘        │
│           │                 │                                        │
│           ▼                 ▼                                        │
│   ┌─────────────────────────────────────────────────────────┐       │
│   │            ZUSTAND STORES (Bridge UI→App)               │       │
│   │  useActivityStore  │  useScheduleStore                  │       │
│   │                    │  (generate + reschedule + suggest) │       │
│   └────────────────────┼────────────────────────────────────┘       │
│                        │                                            │
├────────────────────────┼────────────────────────────────────────────┤
│                 DI LAYER (Dependencies.ts)                           │
│           "Composition Root" — wirea todo                            │
├────────────────────────┼────────────────────────────────────────────┤
│                        │                                            │
│           ┌────────────▼────────────────────────────┐               │
│           │        APPLICATION LAYER                │               │
│           │                                         │               │
│           │  ┌─────────────────────────────────┐    │               │
│           │  │   PORTS IN (Driving Ports)      │    │               │
│           │  │  ┌────────────────────────┐     │    │               │
│           │  │  │ CreateActivityPort     │     │    │               │
│           │  │  │ DeleteActivityPort     │     │    │               │
│           │  │  │ GetActivityPort        │     │    │               │
│           │  │  │ GenerateSchedulePort   │     │    │               │
│           │  │  │ ReschedulePort         │     │    │               │
│           │  │  │ SuggestTaskPort        │     │    │               │
│           │  │  └───────────┬────────────┘     │    │               │
│           │  └──────────────┼──────────────────┘    │               │
│           │                 │                        │               │
│           │  ┌──────────────▼──────────────────┐    │               │
│           │  │      USE CASES                  │    │               │
│           │  │  CreateActivityUseCase          │    │               │
│           │  │  DeleteActivityUseCase          │    │               │
│           │  │  GetActivityUseCase             │    │               │
│           │  │  GenerateScheduleUseCase        │    │               │
│           │  │  RescheduleUseCase              │    │               │
│           │  │  SuggestTaskUseCase             │    │               │
│           │  │         │                       │    │               │
│           │  │         │ (usa interfaces, no   │    │               │
│           │  │         │  implementaciones)    │    │               │
│           │  └─────────┼───────────────────────┘    │               │
│           │            │                            │               │
│           │  ┌─────────▼───────────────────────┐    │               │
│           │  │   PORTS OUT (Driven Ports)      │    │               │
│           │  │  ┌────────────────────────┐     │    │               │
│           │  │  │ ActivityRepository     │     │    │               │
│           │  │  │ ScheduleGenerator      │     │    │               │
│           │  │  │ RescheduleGenerator    │     │    │               │
│           │  │  │ TaskSuggester          │     │    │               │
│           │  │  └────────────────────────┘     │    │               │
│           │  └─────────────────────────────────┘    │               │
│           └────────────────┬───────────────────────┘               │
│                            │                                        │
├────────────────────────────┼────────────────────────────────────────┤
│                            ▼                                        │
│           ┌───────────────────────────────────────────────────┐     │
│           │      INFRASTRUCTURE (Adapters)                     │     │
│           │                                                   │     │
│           │ ┌──────────────────────────────────────────────┐  │     │
│           │ │             DTO LAYER (Tipos planos)          │  │     │
│           │ │  ActivityDto │ LocationDto │ TravelTimeDto    │  │     │
│           │ │  UserContextDto │ ScheduleRequestDto          │  │     │
│           │ │  ScheduleResponseDto │ RescheduleRequestDto   │  │     │
│           │ │  SuggestTaskDto                                │  │     │
│           │ └──────────────────────┬───────────────────────┘  │     │
│           │                        │                          │     │
│           │ ┌──────────────────────▼───────────────────────┐  │     │
│           │ │             API SERVICES + MAPPERS            │  │     │
│           │ │  ScheduleApiService  ← scheduleMapper        │  │     │
│           │ │  RescheduleApiService ← rescheduleMapper     │  │     │
│           │ │  SuggestTaskApiService ← suggestTaskMapper   │  │     │
│           │ └──────────────────────┬───────────────────────┘  │     │
│           │                        │                          │     │
│           │ ┌──────────────────────▼───────────────────────┐  │     │
│           │ │           REPOSITORIES (Adapters)             │  │     │
│           │ │  AsyncStorageActivityRepository              │  │     │
│           │ │  ApiScheduleGenerator                        │  │     │
│           │ │  ApiRescheduleGenerator                      │  │     │
│           │ │  ApiTaskSuggester                            │  │     │
│           │ └──────────────────────────────────────────────┘  │     │
│           │                                                   │     │
│           │   Almacenamiento: AsyncStorage  │  API REST       │     │
│           └───────────────────────────────────────────────────┘     │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    DOMAIN (Core)                             │  │
│   │                                                              │  │
│   │   ┌──────────────┐    ┌──────────────────┐                  │  │
│   │   │   Activity    │    │    Schedule      │                  │  │
│   │   │   (entidad)   │    │    (entidad)     │                  │  │
│   │   └──────────────┘    └──────────────────┘                  │  │
│   │                                                              │  │
│   │   Dependencia: NINGUNA (0 imports externos)                  │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Principio Fundamental: Regla de Dependencia

> Las dependencias apuntan **hacia adentro**. El núcleo (Domain) no sabe nada del mundo exterior.

```
UI → Stores → Use Cases → Puertos (interfaces) → Adapters (implementaciones)
 │                                            │
 │         Todo apunta hacia adentro          │
 └────────────────────────────────────────────┘
```

---

## Capas

### 1. Domain (`src/domain/`) — El Core

Contiene las **entidades del negocio** puras. Sin imports de React, Expo, ni librerías externas.

```typescript
// src/domain/entities/Activity.ts
export class Activity {
    readonly id: string;
    readonly title: string;
    readonly type: ActivityType;

    isFixed(): boolean { ... }
    getTotalTimeRequired(): number { ... }
}
```

```typescript
// src/domain/entities/Schedule.ts
export class Schedule {
    getItemsByDay(day: DayOfWeek): ScheduledActivity[] { ... }
    getTotalActiveMinutes(): number { ... }
    hasActivityAt(day: DayOfWeek, time: string): boolean { ... }
}
```

**Regla:** Domain no importa nada de `application/`, `infrastructure/` ni `presentation/`.

---

### 2. Application (`src/application/`) — Casos de Uso + Puertos

Contiene **qué se puede hacer** en la app, no **cómo** se hace.

#### Puertos de Entrada (Driving Ports) — `ports/in/`

Son las interfaces que definen las operaciones que la aplicación expone al exterior (UI, stores, etc.).

```typescript
// src/application/ports/in/CreateActivityPort.ts
export interface CreateActivityPort {
    execute(command: CreateActivityCommand): Promise<void>
}
```

```typescript
// src/application/ports/in/GenerateSchedulePort.ts
export interface GenerateSchedulePort {
    execute(startHour: number, endHour: number): Promise<Schedule>
}
```

Hay 6 puertos de entrada:
| Puerto | Método |
|--------|--------|
| `CreateActivityPort` | `execute(cmd)` |
| `DeleteActivityPort` | `execute(id)` |
| `GetActivityPort` | `execute()` |
| `GenerateSchedulePort` | `execute(startHour, endHour, options?)` |
| `ReschedulePort` | `execute(request)` |
| `SuggestTaskPort` | `execute(freeMinutes, preferredDay?)` |

#### Puertos de Salida (Driven Ports) — `ports/out/`

Son las interfaces que la aplicación **necesita** del mundo exterior. Definen contratos que los adapters deben implementar.

```typescript
// src/application/ports/out/ActivityRepository.ts
export interface ActivityRepository {
    save(activity: Activity): Promise<void>;
    getAll(): Promise<Activity[]>;
    delete(id: string): Promise<void>;
}
```

```typescript
// src/application/ports/out/ScheduleGenerator.ts
export interface ScheduleGenerator {
    generate(activities: Activity[], startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule>;
}
```

```typescript
// src/application/ports/out/RescheduleGenerator.ts
export interface RescheduleGenerator {
    replanificar(request: RescheduleRequestDto): Promise<ScheduleResponseDto>;
}
```

```typescript
// src/application/ports/out/TaskSuggester.ts
export interface TaskSuggester {
    suggestTasks(request: SugerirTareaRequestDto): Promise<SugerirTareaResponseDto>;
}
```

Hay 4 puertos de salida:
| Puerto | Método | Implementación |
|--------|--------|----------------|
| `ActivityRepository` | `save`, `getAll`, `delete` | `AsyncStorageActivityRepository` |
| `ScheduleGenerator` | `generate(activities, startHour, endHour, options?)` | `ApiScheduleGenerator` |
| `RescheduleGenerator` | `replanificar(request)` | `ApiRescheduleGenerator` |
| `TaskSuggester` | `suggestTasks(request)` | `ApiTaskSuggester` |

#### Casos de Uso — `use-cases/`

Implementan los puertos de entrada. Orquestan la lógica de negocio usando **solo las interfaces** de los puertos de salida (nunca las implementaciones concretas).

```typescript
// src/application/use-cases/CreateActivityUseCase.ts
export class CreateActivityUseCase implements CreateActivityPort {
    constructor(
        private activityRepository: ActivityRepository  ← INTERFAZ, no implementación
    ) { }

    async execute(cmd: CreateActivityCommand): Promise<void> {
        const activity = new Activity({ ...cmd });
        await this.activityRepository.save(activity);
    }
}
```

```typescript
// src/application/use-cases/GenerateScheduleUseCase.ts
export class GenerateScheduleUseCase implements GenerateSchedulePort {
    constructor(
        private scheduleGenerator: ScheduleGenerator,      ← INTERFAZ
        private activityRepository: ActivityRepository      ← INTERFAZ
    ) { }

    async execute(startHour: number, endHour: number, options?: GenerateScheduleOptions): Promise<Schedule> {
        const activities = await this.activityRepository.getAll();
        return await this.scheduleGenerator.generate(activities, startHour, endHour, options);
    }
}
```

```typescript
// src/application/use-cases/RescheduleUseCase.ts
export class RescheduleUseCase implements ReschedulePort {
    constructor(
        private rescheduleGenerator: RescheduleGenerator,  ← INTERFAZ
        private activityRepository: ActivityRepository      ← INTERFAZ
    ) {}

    async execute(request: RescheduleRequestDto): Promise<Schedule> {
        const response = await this.rescheduleGenerator.replanificar(request);
        const activities = await this.activityRepository.getAll();
        return scheduleResponseToDomain(response, activities);
    }
}
```

```typescript
// src/application/use-cases/SuggestTaskUseCase.ts
export class SuggestTaskUseCase implements SuggestTaskPort {
    constructor(
        private taskSuggester: TaskSuggester,              ← INTERFAZ
        private activityRepository: ActivityRepository      ← INTERFAZ
    ) {}

    async execute(freeMinutes: number, preferredDay?: number): Promise<SugerenciaTareaDto[]> {
        const allActivities = await this.activityRepository.getAll();
        const pending = allActivities.filter(a => !a.isFixed());
        const request = {
            tiempo_libre_minutos: freeMinutes,
            tareas_pendientes: domainToTareaPendiente(pending),
        };
        const response = await this.taskSuggester.suggestTasks(request);
        return response.sugerencias;
    }
}
```

Hay 6 casos de uso:

| Caso de Uso | Puerto que implementa | Puertos de salida que usa |
|---|---|---|
| `CreateActivityUseCase` | `CreateActivityPort` | `ActivityRepository` |
| `DeleteActivityUseCase` | `DeleteActivityPort` | `ActivityRepository` |
| `GetActivityUseCase` | `GetActivityPort` | `ActivityRepository` |
| `GenerateScheduleUseCase` | `GenerateSchedulePort` | `ActivityRepository`, `ScheduleGenerator` |
| `RescheduleUseCase` | `ReschedulePort` | `ActivityRepository`, `RescheduleGenerator` |
| `SuggestTaskUseCase` | `SuggestTaskPort` | `ActivityRepository`, `TaskSuggester` |

---

### 3. Infrastructure (`src/infrastructure/`) — Adaptadores (Adapters)

Contiene las **implementaciones concretas** de los puertos de salida. Cada adapter implementa una interfaz del `ports/out/`.

```
Puerto (interfaz)          →  Adapter (implementación)       (stack)
───────────────────────────────────────────────────────────────────────
ActivityRepository         →  AsyncStorageActivityRepository  (AsyncStorage)
ScheduleGenerator          →  ApiScheduleGenerator            (REST API /generar)
RescheduleGenerator        →  ApiRescheduleGenerator          (REST API /replanificar)
TaskSuggester              →  ApiTaskSuggester                (REST API /suggest-task)
```

```typescript
// src/infrastructure/repositories/AsyncStorageActivityRepository.ts
export class AsyncStorageActivityRepository implements ActivityRepository {
    async save(activity: Activity): Promise<void> {
        const all = await this.getAll();
        all.push(activity);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    async getAll(): Promise<Activity[]> { ... }
    async delete(id: string): Promise<void> { ... }
}
```

```typescript
// src/infrastructure/repositories/ApiScheduleGenerator.ts
export class ApiScheduleGenerator implements ScheduleGenerator {
    async generate(activities, startHour, endHour, options?): Promise<Schedule> {
        const requestDto = domainToScheduleRequest(activities, startHour, endHour, options);
        const responseDto = await ScheduleApiService(requestDto);
        return scheduleResponseToDomain(responseDto, activities);
    }
}
```

Además, aquí viven:

#### DTO Layer (`infrastructure/api/dto/`)

**8 archivos** de tipos planos TypeScript que reflejan exactamente los schemas Pydantic del backend:

| DTO | Propósito |
|-----|-----------|
| `ActivityDto` | `ActividadFijaDto`, `TareaPendienteDto`, enums `BackendActivityType`, `BackendDifficulty` |
| `LocationDto` | `UbicacionDto` (id, nombre, latitud, longitud) |
| `TravelTimeDto` | `TiempoTrasladoDto` (origen, destino, minutos) |
| `UserContextDto` | `ContextoUsuarioDto`, `BloqueSuenoDto` |
| `ScheduleRequestDto` | Payload completo para POST /generar |
| `ScheduleResponseDto` | `{ estado, bloques, mensaje }` con `ScheduleEstado` |
| `RescheduleRequestDto` | Payload para POST /replanificar |
| `SuggestTaskDto` | Requests/responses para POST /suggest-task |

Los DTOs son la **frontera con el backend**. Los mappers (`infrastructure/api/mappers/`) convierten entre estos DTOs y las entidades de dominio.

#### API Services (`infrastructure/api/`)

| Servicio | Endpoint | Mapper |
|----------|----------|--------|
| `ScheduleApiService` | `POST /api/v1/horarios/generar` | `scheduleMapper.ts` |
| `RescheduleApiService` | `POST /api/v1/horarios/replanificar` | `rescheduleMapper.ts` |
| `SuggestTaskApiService` | `POST /schedule/suggest-task` | `suggestTaskMapper.ts` |

#### Zustand Stores (`infrastructure/store/`)

Actúan como bridge entre la UI y los casos de uso. Reciben casos de uso inyectados y exponen un API Reactivo:

```typescript
// useScheduleStore expone:
// - handleGenerateSchedule()       → genera horario completo
// - handleReschedule(id, minutos)  → replanifica cuando cambia una actividad
// - handleSuggestTask(minutos)     → sugiere tareas para tiempo libre
```

#### Persistencia (`infrastructure/persistence/`)

Lectura/escritura de AsyncStorage para configuración del usuario (horario de inicio/fin del día).

---

### 4. DI Layer (`src/di/Dependencies.ts`) — Composition Root

Es el **único lugar** donde se crean las instancias concretas y se wirean las dependencias.

```typescript
// 1. Crear adapters concretos
const activityRepository: ActivityRepository = new AsyncStorageActivityRepository();
const scheduleGenerator: ScheduleGenerator = new ApiScheduleGenerator();
const rescheduleGenerator: RescheduleGenerator = new ApiRescheduleGenerator();
const taskSuggester: TaskSuggester = new ApiTaskSuggester();

// 2. Inyectar adapters en casos de uso
export const generateScheduleUseCase = new GenerateScheduleUseCase(
    scheduleGenerator, activityRepository
);
export const createActivityUseCase = new CreateActivityUseCase(activityRepository);
export const rescheduleUseCase = new RescheduleUseCase(
    rescheduleGenerator, activityRepository
);
export const suggestTaskUseCase = new SuggestTaskUseCase(
    taskSuggester, activityRepository
);

// 3. Inyectar casos de uso en stores (zustand)
export const useActivityStore = createActivityStore(
    getActivityUseCase, createActivityUseCase, deleteActivityUseCase
);
export const useScheduleStore = createScheduleStore(
    generateScheduleUseCase, asyncStorageDayLimitPersistence,
    rescheduleUseCase, suggestTaskUseCase
);
```

Si mañana cambias AsyncStorage por SQLite, solo creas un nuevo adapter y lo cambias aquí. **El resto de la app ni se entera.**

---

### 5. Presentation (`src/presentation/`) — UI

React Native puro: screens, componentes atómicos (atomic design), hooks, navegación. Consume los stores de Zustand (que internamente llaman casos de uso).

```typescript
// En un screen:
import { useActivityStore } from '../../../di/Dependencies';

function ActivityListView() {
    const activities = useActivityStore(s => s.activities);
    const loadActivities = useActivityStore(s => s.loadActivities);

    useEffect(() => { loadActivities(); }, []);

    return <FlatList data={activities} ... />;
}
```

---

## Flujo Completo: Datos en Movimiento

### Crear una Actividad

```
Usuario toca "Guardar"
       ↓
CreateActivityScreen
       ↓  llama
useActivityStore.handleCreateActivity(cmd)
       ↓  delega
CreateActivityUseCase.execute(cmd)    ← Driving Port
       ↓  llama interfaz
ActivityRepository.save(activity)     ← Driven Port (interfaz)
       ↓  ejecuta implementación
AsyncStorageActivityRepository.save() ← Adapter concreto
       ↓
AsyncStorage.setItem()                ← Mundo exterior
```

### Generar Horario

```
Usuario toca "Generar"
       ↓
ScheduleView
       ↓  llama
useScheduleStore.handleGenerateSchedule()
       ↓  delega
GenerateScheduleUseCase.execute(startHour, endHour, options?)  ← Driving Port
       ↓  llama interfaces
ActivityRepository.getAll()           ← Driven Port (interfaz)
ScheduleGenerator.generate(...)       ← Driven Port (interfaz)
       ↓  ejecutan adapters
AsyncStorageActivityRepository.getAll()
ApiScheduleGenerator.generate(...)
       │
       ├─ domainToScheduleRequest()   ← mapper: entidades → DTOs
       ├─ ScheduleApiService(dto)     ← HTTP POST → Backend
       └─ scheduleResponseToDomain()  ← mapper: DTOs → entidades
       ↓
Schedule con estado + bloques
```

### Replanificar Horario

```
Usuario elimina/modifica una actividad
       ↓
Vista → useScheduleStore.handleReschedule(id, minutosPerdidos)
       ↓  delega
RescheduleUseCase.execute(request)    ← Driving Port
       ↓  llama interfaz
RescheduleGenerator.replanificar(request)  ← Driven Port
       ↓  ejecuta adapter
ApiRescheduleGenerator.replanificar()
       │
       ├─ scheduleToBloqueTiempo()    ← mapper: Schedule actual → DTO
       ├─ RescheduleApiService(dto)   ← HTTP POST → Backend
       └─ scheduleResponseToDomain()  ← mapper: DTOs → Schedule
       ↓
Schedule re-optimizado
```

### Sugerir Tareas

```
Usuario tiene tiempo libre
       ↓
Vista → useScheduleStore.handleSuggestTask(minutosLibres)
       ↓  delega
SuggestTaskUseCase.execute(freeMinutes)  ← Driving Port
       ↓  obtiene actividades
ActivityRepository.getAll()              ← Driven Port
       ↓  filtra flexibles + mappea
domainToTareaPendiente(actividadesFlexibles)  ← mapper
       ↓  llama interfaz
TaskSuggester.suggestTasks(request)      ← Driven Port
       ↓  ejecuta adapter
ApiTaskSuggester.suggestTasks()
       ↓  HTTP POST → Backend
Sugerencias ordenadas por prioridad
```

---

## ¿Qué ganas con esta arquitectura?

| Beneficio | Cómo lo logra |
|-----------|---------------|
| **Testeable** | Los casos de uso trabajan con interfaces. Puedes mockear `ActivityRepository`, `ScheduleGenerator`, etc. y probar la lógica sin AsyncStorage, HTTP ni UI. |
| **Desacoplado** | La UI (React Native) puede cambiar completamente sin tocar domain ni application. |
| **Intercambiable** | Cambiar AsyncStorage por SQLite, o el backend por otro, es crear un nuevo adapter y cambiar 1 línea en `Dependencies.ts`. |
| **DTOs aislados** | Los tipos de red (`dto/`) están separados de las entidades de dominio. Los mappers traducen entre ambos mundos. |
| **Domain puro** | La lógica de negocio vive en TypeScript sin frameworks. No depende de React, Expo, ni de ninguna librería externa. |

---

## Nomenclatura Hexagonal

| Término hexagonal | En este proyecto |
|---|---|
| **Driving Port** (Puerto de entrada) | `application/ports/in/*.ts` — interfaces que los casos de uso implementan |
| **Driven Port** (Puerto de salida) | `application/ports/out/*.ts` — interfaces que los adapters implementan |
| **Driving Adapter** (Adapter primario) | La UI + Zustand Stores — conducen la aplicación |
| **Driven Adapter** (Adapter secundario) | `AsyncStorageActivityRepository`, `ApiScheduleGenerator`, `ApiRescheduleGenerator`, `ApiTaskSuggester` — implementan los puertos de salida |
| **Composition Root** | `di/Dependencies.ts` — wirea todo |
| **Use Case** (Caso de uso) | `application/use-cases/*.ts` — orquesta la lógica |
| **Entity** (Entidad) | `domain/entities/*.ts` — core del negocio |
| **DTO** (Data Transfer Object) | `infrastructure/api/dto/*.ts` — tipos planos que reflejan los schemas del backend |
| **Mapper** | `infrastructure/api/mappers/*.ts` — convierte entre entidades de dominio y DTOs de red |
