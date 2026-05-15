# ikeep-app — Arquitectura Hexagonal (Ports & Adapters)

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION                              │
│                  (React Native — Screens, Atoms, Hooks)          │
│                                                                  │
│   ┌───────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│   │ ActivityList  │  │ ScheduleView │  │ SettingsView      │   │
│   └───────┬───────┘  └──────┬───────┘  └───────────────────┘   │
│           │                 │                                    │
│           ▼                 ▼                                    │
│   ┌──────────────────────────────────────────────────────┐      │
│   │            ZUSTAND STORES (Bridge UI→App)            │      │
│   │  useActivityStore  │  useScheduleStore               │      │
│   └────────────────────┼─────────────────────────────────┘      │
│                        │                                        │
├────────────────────────┼────────────────────────────────────────┤
│                 DI LAYER (Dependencies.ts)                       │
│           "Composition Root" — wirea todo                        │
├────────────────────────┼────────────────────────────────────────┤
│                        │                                        │
│           ┌────────────▼────────────────────────────┐           │
│           │        APPLICATION LAYER                │           │
│           │                                         │           │
│           │  ┌─────────────────────────────────┐    │           │
│           │  │   PORTS IN (Driving Ports)      │    │           │
│           │  │  ┌────────────────────────┐     │    │           │
│           │  │  │ CreateActivityPort     │     │    │           │
│           │  │  │ DeleteActivityPort     │     │    │           │
│           │  │  │ GetActivityPort        │     │    │           │
│           │  │  │ GenerateSchedulePort   │     │    │           │
│           │  │  └───────────┬────────────┘     │    │           │
│           │  └──────────────┼──────────────────┘    │           │
│           │                 │                        │           │
│           │  ┌──────────────▼──────────────────┐    │           │
│           │  │      USE CASES                  │    │           │
│           │  │  CreateActivityUseCase          │    │           │
│           │  │  DeleteActivityUseCase          │    │           │
│           │  │  GetActivityUseCase             │    │           │
│           │  │  GenerateScheduleUseCase        │    │           │
│           │  │         │                       │    │           │
│           │  │         │ (usa interfaces, no   │    │           │
│           │  │         │  implementaciones)    │    │           │
│           │  └─────────┼───────────────────────┘    │           │
│           │            │                            │           │
│           │  ┌─────────▼───────────────────────┐    │           │
│           │  │   PORTS OUT (Driven Ports)      │    │           │
│           │  │  ┌────────────────────────┐     │    │           │
│           │  │  │ ActivityRepository     │     │    │           │
│           │  │  │ ScheduleGenerator      │     │    │           │
│           │  │  └────────────────────────┘     │    │           │
│           │  └─────────────────────────────────┘    │           │
│           └────────────────┬───────────────────────┘           │
│                            │                                    │
├────────────────────────────┼────────────────────────────────────┤
│                            ▼                                    │
│           ┌──────────────────────────────────────┐              │
│           │      INFRASTRUCTURE (Adapters)        │              │
│           │                                       │              │
│           │  ActivityRepository     ScheduleGenerator           │
│           │  (interfaz)            (interfaz)      │              │
│           │       │                     │          │              │
│           │       ▼                     ▼          │              │
│           │  AsyncStorage          ApiSchedule    │              │
│           │  ActivityRepository    Generator      │              │
│           │  (AsyncStorage)        (REST API)     │              │
│           └───────────────────────────────────────┘              │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │                    DOMAIN (Core)                         │   │
│   │                                                         │   │
│   │   ┌──────────────┐    ┌──────────────────┐              │   │
│   │   │   Activity    │    │    Schedule      │              │   │
│   │   │   (entidad)   │    │    (entidad)     │              │   │
│   │   └──────────────┘    └──────────────────┘              │   │
│   │                                                         │   │
│   │   Dependencia: NINGUNA (0 imports externos)             │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
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

Hay 4 puertos de entrada:
| Puerto | Método |
|--------|--------|
| `CreateActivityPort` | `execute(cmd)` |
| `DeleteActivityPort` | `execute(id)` |
| `GetActivityPort` | `execute()` |
| `GenerateSchedulePort` | `execute(startHour, endHour)` |

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
    generate(activities: Activity[], startHour: number, endHour: number): Promise<Schedule>;
}
```

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

    async execute(startHour: number, endHour: number): Promise<Schedule> {
        const activities = await this.activityRepository.getAll();
        return await this.scheduleGenerator.generate(activities, startHour, endHour);
    }
}
```

---

### 3. Infrastructure (`src/infrastructure/`) — Adaptadores (Adapters)

Contiene las **implementaciones concretas** de los puertos de salida. Cada adapter implementa una interfaz del `ports/out/`.

```
Puerto (interfaz)          →  Adapter (implementación)
─────────────────────────────────────────────────────
ActivityRepository         →  AsyncStorageActivityRepository  (persistencia local)
ScheduleGenerator          →  ApiScheduleGenerator            (llamada HTTP)
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
    async generate(activities: Activity[], startHour: number, endHour: number): Promise<Schedule> {
        return await ScheduleApiService(activities, startHour, endHour);
    }
}
```

Además, aquí viven:
- **Zustand Stores** (`infrastructure/store/`) — actúan como bridge entre la UI y los casos de uso. Reciben casos de uso inyectados y exponen un API Reactivo.
- **API Service** (`infrastructure/api/`) — cliente HTTP + mappers para el backend REST.
- **Persistencia** (`infrastructure/persistence/`) — lectura/escritura de AsyncStorage para configuración.

---

### 4. DI Layer (`src/di/Dependencies.ts`) — Composition Root

Es el **único lugar** donde se crean las instancias concretas y se wirean las dependencias.

```typescript
// 1. Crear adapters concretos
const activityRepository: ActivityRepository = new AsyncStorageActivityRepository();
const scheduleGenerator: ScheduleGenerator = new ApiScheduleGenerator();

// 2. Inyectar adapters en casos de uso
export const generateScheduleUseCase = new GenerateScheduleUseCase(
    scheduleGenerator,
    activityRepository
);
export const createActivityUseCase = new CreateActivityUseCase(activityRepository);

// 3. Inyectar casos de uso en stores (zustand)
export const useActivityStore = createActivityStore(
    getActivityUseCase,
    createActivityUseCase,
    deleteActivityUseCase
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
GenerateScheduleUseCase.execute(startHour, endHour)  ← Driving Port
       ↓  llama interfaz
ActivityRepository.getAll()          ← Driven Port (interfaz)
ScheduleGenerator.generate(...)      ← Driven Port (interfaz)
       ↓  ejecutan adapters
AsyncStorageActivityRepository.getAll()
ApiScheduleGenerator.generate(...)
       ↓
AsyncStorage  +  HTTP POST → Backend
```

---

## ¿Qué ganas con esta arquitectura?

| Beneficio | Cómo lo logra |
|-----------|---------------|
| **Testeable** | Los casos de uso trabajan con interfaces. Puedes mockear `ActivityRepository` y probar la lógica de negocio sin tocar AsyncStorage ni la UI. |
| **Desacoplado** | La UI (React Native) puede cambiar completamente sin tocar domain ni application. |
| **Intercambiable** | Cambiar AsyncStorage por SQLite, o el backend por otro, es crear un nuevo adapter y cambiar 1 línea en `Dependencies.ts`. |
| **Domain puro** | La lógica de negocio vive en TypeScript sin frameworks. No depende de React, Expo, ni de ninguna librería externa. |

---

## Nomenclatura Hexagonal

| Término hexagonal | En este proyecto |
|---|---|
| **Driving Port** (Puerto de entrada) | `application/ports/in/*.ts` — interfaces que los casos de uso implementan |
| **Driven Port** (Puerto de salida) | `application/ports/out/*.ts` — interfaces que los adapters implementan |
| **Driving Adapter** (Adapter primario) | La UI + Zustand Stores — conducen la aplicación |
| **Driven Adapter** (Adapter secundario) | `AsyncStorageActivityRepository`, `ApiScheduleGenerator` — implementan los puertos de salida |
| **Composition Root** | `di/Dependencies.ts` — wirea todo |
| **Use Case** (Caso de uso) | `application/use-cases/*.ts` — orquesta la lógica |
| **Entity** (Entidad) | `domain/entities/*.ts` — core del negocio |
