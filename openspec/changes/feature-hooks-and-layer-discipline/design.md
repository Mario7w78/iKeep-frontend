# Design: feature-hooks-and-layer-discipline

## Technical Approach

Disciplinar la frontera de presentación sin tocar el núcleo hexagonal: stores por factory con repositorio inyectado (`createEnergyStore`), el puerto `EnergyRepository` como única vía de energía, stores singleton re-exportados desde `di/Dependencies`, `fechaLocal` consolidada en `application/utils`, y la fachada `EnergyHistoryService` borrada al final. La extracción de `HomeView` se hace DESPUÉS del cableado, en PR2, con 5 hooks puros/testables y tests que fijan los contratos actuales (los días 30/14 por llamador, el orden save→refresh→reflexión→regenerate, cerrar-antes-del-servidor). Todo verificado contra el código real: los 4 consumidores de la fachada son `HomeView` (36-40), `ScheduleView` (14-18), `SettingsView` (22-25) y `useScheduleStore` (16); solo `useRewardsStore` importa de `Dependencies` entre los stores de infraestructura (re-exports libres de ciclos); `toMinutes` vive únicamente en `HomeView` (87) y se relocaliza con el hook de timeline; `history()` del adaptador Supabase ordena `timestamp DESC` (el más nuevo primero) — relevante para el ADR-7.

## Architecture Decisions

| # | Decisión | Opciones | Tradeoff | Decisión |
|---|---|---|---|---|
| ADR-1 (D1) | `createEnergyStore(repository)` factory Zustand | factory (patrón `createScheduleStore`/`createActivityStore`) vs. hook con funciones inyectadas | La factory centraliza el orden save→refresh EN UN lugar testable y es la convención del repo; el hook deja cableado propio en cada pantalla | **Factory** |
| ADR-2 | Store SIN historial compartido | estado `historial` en el store vs. solo acciones | Home (30 d) y Schedule (14 d) están co-montados en el tab navigator; un estado compartido se pisaría | **Solo acciones**; cada consumidor conserva su estado local |
| ADR-3 (D2) | Re-export de 5 stores desde `Dependencies` | re-export vs. shims vs. mantener directo | Verificado: los 5 no importan de `Dependencies` → libres de ciclos | **Re-export** (`useAppStore`, `useFocusSessionStore`, `useAuthStore`, `useCalendarStore`, `useWizardDraftStore`) |
| ADR-4 (D2) | `useRewardsStore` NO se re-exporta | re-exportarla | Importa `notificationScheduler` desde `Dependencies` (línea 15) → ciclo `Dependencies→useRewardsStore→Dependencies` | **Import directo sancionado** (V11) hasta la ola factory; TODO documentado |
| ADR-5 (D3) | `fechaLocal` única en `src/application/utils/dateTime.ts` | `application/utils` vs. `presentation/utils/timeUtils` | `useRewardsStore` y `useFocusSessionStore` (infra) la consumen como default; en `application` ambos lados importan legalmente; en `presentation` crearía un edge infra→presentation nuevo | **`application/utils/dateTime.ts`**; sin shims en los API services |
| ADR-6 (D4) | BORRAR `EnergyHistoryService` | borrar vs. shim deprecated | Con cero consumidores, el shim deja DOS caminos al mismo repositorio y riesgo de divergencia; git conserva el historial | **Borrar** como ÚLTIMO commit de PR1, gate: `pnpm tsc --noEmit` + `pnpm test` verdes + grep cero residuos. El flag `USA_BACKEND_PARA_DATOS` se queda en `config/` (aún lo importan `SchedulePersistenceAdapters` y `Dependencies`); retoque del comentario en `featureFlags.ts:8-10` |
| ADR-7 | `handleReschedule` lee `historial[0]` — PRESERVAR | preservar vs. normalizar a `[length-1]` | Hoy el payload al servidor usa `historial[0]`. El adaptador Supabase ordena DESC (más nuevo primero) y HomeView preselecciona con `[length-1]` (lecturas divergentes PREEXISTENTES, ninguna documentada como contrato). Normalizar CAMBIA los payloads del server sin pedido | **Preservar tal cual**: `const historial = await energyRepository.history(14); const lastRecord = historial.length > 0 ? historial[0] : null;` — no tocar el orden del array. (Observación para tasks: el orden del adaptador backend no es verificable desde este repo; el comportamiento se conserva igualmente.) |
| ADR-8 (R0) | Español neutral en textos UI | — | Regla del usuario | Aplica solo a strings NUEVOS o MODIFICADOS por este cambio. En la práctica el cambio casi no introduce copy: los strings del Alert de energía se mueven verbatim (ya neutros: "¿Estás seguro…"). Auditoría con grep en verify |
| ADR-9 | `useDayClose` usa `useNow` internamente | interno vs. `ahora` por parámetro | Interno = hook autocontenido (la tabla de propuesta lo fija); implica un segundo ticker de 10 s en Home (dos `setInterval` triviales). Shared-ticker requeriría contexto/provider — sobre-ingeniería para este cambio | **Interno**; duplicación documentada y aceptada |
| ADR-10 | Doble escritura del patrón manual preservada | consolidar vs. preservar | `SettingsView` hoy escribe 2 veces (`saveEnergyPatternOverride` directo línea 310 + `setCustomEnergyPattern` línea 311, que internamente persiste de nuevo). Comportamiento preexistente | **Preservar**: `guardarPatronManual(p)` (store) + `setCustomEnergyPattern(p)` (schedule store) se siguen llamando; contrato idéntico, otro origen |
| ADR-11 | `toMinutes` se muda a `src/presentation/utils/scheduleUtils.ts` | scheduleUtils vs. hook local | Solo existe en HomeView hoy; el hook `useTodayTimeline` (puro) lo necesita y `JS_DAY_TO_DAYOFWEEK` ya vive allí | **Export en scheduleUtils**; la copia de HomeView se borra |

## Interfaces / Contracts

### `src/infrastructure/store/useEnergyStore.ts` (NUEVO) — ADR-1/ADR-2

```ts
// Mapeo 1:1 contra el port EnergyRepository — SIN GAPS: getPatternOverride/
// savePatternOverride existen (la fachada los nombraba get/saveEnergyPatternOverride).
export interface EnergyStoreState {
  patronManual: string | null;      // para SettingsView (ADR-10)
  cargando: boolean;                // solo acciones de patrón (convención stores)
  cargarHistorial: (dias: number) => Promise<EnergyRecord[]>;           // repository.history(dias); NO escribe estado; rechaza si falla
  guardarNivel: (nivel: number, dias: number) => Promise<EnergyRecord[]>; // save ANTES que history → resuelve historial fresco; rechaza si falla
  reportadoHoy: () => Promise<boolean>;                                   // repository.reportedToday() (conservado, hoy sin consumidores)
  cargarPatronManual: () => Promise<void>;     // repository.getPatternOverride() → set patronManual; catch → console.warn (adorno, como useRewardsStore)
  guardarPatronManual: (patron: string | null) => Promise<void>; // repository.savePatternOverride → set tras éxito (como setCustomEnergyPattern); catch → console.error
}
export type EnergyStore = UseBoundStore<StoreApi<EnergyStoreState>>;
export function createEnergyStore(repository: EnergyRepository): EnergyStore;
// makeEnergyRecord se MUDA aquí (colocación); export público para tests.
export function makeEnergyRecord(nivel: number, contexto?: string): EnergyRecord;
```

`guardarNivel` — el corazón del contrato de orden (spec home-dashboard §1, escenarios 1-2):

```ts
guardarNivel: async (nivel, dias) => {
  await repository.save(makeEnergyRecord(nivel)); // ANTES del refresco — spec esc. 1
  return repository.history(dias);                // historial fresco, días del llamador — spec esc. 2
},
```

### 5 hooks — `src/presentation/hooks/` (plano, convención confirmada)

```ts
// useNow.ts — extrae 199-206
export function useNow(intervalMs: number = 10000): { ahora: Date; minutosDelDia: number };
// setInterval(intervalMs) → setState(new Date()); clearInterval en unmount. minutosDelDia = horas*60+minutos.

// useTodayTimeline.ts — extrae 192-197, 208-287; derivación PURA, `ahora` inyectado (spec §5, esc. 13-16)
export interface TimelineInputs {
  schedule: Schedule | null;
  startHour: number;
  perDayStartHours: number[] | null;
  completadas: string[];
  noHechas: string[];
  ahora: Date;
}
export interface TimelineResult {
  todayItems: ReturnType<Schedule['getItemsByDay']>;         // perDayStartHours[dayIndex] ?? startHour (201-196/260-261)
  currentActivity: ReturnType<Schedule['getItemsByDay']>[number] | undefined; // rango INCLUSIVO start<=m<=end
  nextActivities: ReturnType<Schedule['getItemsByDay']>[number][]; // start>m && activity && tipo!=='viaje' (esc. 14)
  firstNext: ReturnType<Schedule['getItemsByDay']>[number] | undefined;
  nextDayWithItems: { day: DayOfWeek; items: ReturnType<Schedule['getItemsByDay']>[number][] } | null; // lookahead 1..7 cruzando semana, mismo fallback, viaje excluido (esc. 15)
  minutesLeft: number | null;                                  // Math.max(end - m, 0); null sin actividad actual
  freeTimeMinutes: number | null;                              // solo estado libre; sin items hoy → 1440-m; todo hecho → 1440-max(lastEnd, m) (esc. 16)
  sinResolver: Pendiente[];                                    // sinResponder({items: todayItems, minutoActual, completadas, noHechas}) (dominio puro)
}
export function useTodayTimeline(inputs: TimelineInputs): TimelineResult;
// Dependencias puras: sinResponder (domain/services/pendingAnswers), JS_DAY_TO_DAYOFWEEK + toMinutes (presentation/utils/scheduleUtils). Sin new Date() dentro (usa inputs.ahora).

// useDayClose.ts — extrae 242-252, 468-488; ADR-9
export interface DayCloseInputs {
  pendientes: Pendiente[];
  cerrar?: (respuesta: RespuestaDeCierre, hechas?: string[], fecha?: string) => Promise<void>;
  // default: useRewardsStore.getState().cerrar — import directo sancionado V11
}
export interface DayCloseResult {
  ofrecerCierre: boolean;    // correspondeOfrecerCierre({hora: ahora.getHours(), sinResolver: pendientes.length, yaCerro: diaCerrado === hoyISO})
  cerrandoDia: boolean;
  onCerrar: () => void;      // setDiaCerrado(hoyISO) SIN llamada al server (spec esc. 10)
  onResponder: (respuesta: RespuestaDeCierre, hechas?: string[]) => Promise<void>;
  // marca cerrado ANTES de await cerrar (485-487); catch silencioso; finally cerrandoDia=false (spec esc. 9/11)
}
export function useDayClose(inputs: DayCloseInputs): DayCloseResult;
// hoyISO = fechaLocal() desde application/utils/dateTime; RespuestaDeCierre tipo-only (V10).
// `cerrar` rechaza → *no* se relanza (hoy el catch está en HomeView).

// useEnergyCheckIn.ts — extrae 142-178, 289-340; spec §2, esc. 4-8
export interface EnergyCheckInDeps {
  energyStore?: EnergyStore;                          // default: useEnergyStore (DI)
  onRegenerate?: ScheduleStore['handleGenerateSchedule']; // default: useScheduleStore (DI)
}
export interface EnergyCheckInResult {
  energyIndex: number;
  reflexion: Reflexion | null;
  moveEnergy: (direccion: -1 | 1) => void;   // wrap-around 0..2 (291-298)
  handleSaveEnergy: () => void;              // dueño del Alert de confirmación (300-340): Cancelar → setEnergyIndex(savedEnergyIndex); "Sí, actualizar" → flow de guardado
  hayCambios: boolean;                       // energyIndex !== savedEnergyIndex
}
export function useEnergyCheckIn(deps: EnergyCheckInDeps = {}): EnergyCheckInResult;
// Init (152-178, con DIAS_DE_HISTORIAL = 30 movido al hook): cargarHistorial(30);
//   empty → índices 1/1 (estable, esc. 5); no-empty → latest = history[history.length - 1]
//   (PRESERVAR posición [length-1]), idx = latest.nivel - 1 con clamp 0..2 (esc. 4), reflexionar(nivel, history) (esc. 6).
// Guardado (316-335): guardarNivel(nivel, 30) → historial fresco → reflexionar(nivel, historial)
//   → onRegenerate({nivel_energia, historial_energia}, true) COMO ÚLTIMO PASO — la reflexión
//   persiste aunque la regeneración falle (esc. 7). Error de guardado → console.error (334-336).

// useHomeDashboard.ts — extrae 111-134, 136-140, 186-190, 446-466; spec §6, esc. 17-18
export interface HomeDashboardDeps {
  appStore?: typeof useAppStore;            // default: singletons DI
  scheduleStore?: typeof useScheduleStore;  // default: singletons DI
  activityStore?: typeof useActivityStore;  // default: singletons DI
  rewardsStore?: typeof useRewardsStore;    // default: directo (excepción V11)
  focusStore?: typeof useFocusSessionStore; // default: singletons DI
}
export interface HomeDashboardResult {
  username: string;
  schedule: Schedule | null;
  activities: Activity[];
  cargandoActividades: boolean;
  racha: Racha; progreso: ProgresoDelDia; diasTerminados: number;
  alternarCompletada: (activityId: string, fecha?: string) => Promise<void>; // rewards.alternar
  cargarLogros: (fecha?: string) => Promise<void>;                           // rewards.cargar
  autoGenerarAlCargar: () => void;   // callback del efecto de auto-generación (esc. 17)
  sesion: SesionEnfocada | null;
  focusActions: {
    iniciarSesion: (activityId: string, metaMinutos: number) => void;
    anotarSalida: () => void;
    onTerminar: () => Promise<void>;   // await terminar() → await cargarLogros(); catch {} — el store conserva la sesión (455-465, esc. 18)
    descartarSesion: () => void;
    guardandoSesion: boolean;
  };
}
export function useHomeDashboard(deps: HomeDashboardDeps = {}): HomeDashboardResult;
// Efectos internos: cargarLogros() al montar (137-140); auto-generación si
// isLoadedFromStorage && activities.length > 0 && schedule === null (186-190).
// Racha/ProgresoDelDia/SesionEnfocada: types importados de RewardsApiService/domain (V10 ok).
```

### `fechaLocal` — `src/application/utils/dateTime.ts` (NUEVO, ADR-5)

```ts
/** `YYYY-MM-DD` del día del usuario, no del UTC. (JSDoc heredado de RewardsApiService.) */
export function fechaLocal(momento: Date = new Date()): string {
  const mes = String(momento.getMonth() + 1).padStart(2, '0');
  const dia = String(momento.getDate()).padStart(2, '0');
  return `${momento.getFullYear()}-${mes}-${dia}`;
}
```

Compatible con los call-sites de `aFechaLocal(d)` (argumento posicional mismo tipo). Consumidores que actualizan el import: `RewardsApiService` (borra la definición local; sus 5 defaults internos siguen funcionando), `CalendarApiService` (borra `aFechaLocal`; `Ocurrencia` queda type-only, V10), `useRewardsStore` (12), `useFocusSessionStore` (12), `useCalendarStore` (6), `HomeView` (34 + `hoyISO`, PR1), `StatsView` (8), `MonthGrid` (5, swap `aFechaLocal`→`fechaLocal`). Tests que repuntan el mock al módulo nuevo: `useRewardsStore.test.ts:23`, `useCalendarStore.test.ts:17`, `StatsView.test.tsx:18`.

### `createScheduleStore` — parámetro obligatorio (V4, spec §3)

```ts
export function createScheduleStore(
  generateScheduleUseCase: GenerateSchedulePort,
  dayLimitPersistence: DayLimitPersistence,
  activityRepository: ActivityRepository,
  energyRepository: EnergyRepository,   // NUEVO, obligatorio (TS: no puede ir tras optional; va 4º antes de los opcionales)
  rescheduleUseCase?: ReschedulePort,
  suggestTaskUseCase?: SuggestTaskPort,
  notificationScheduler?: NotificationScheduler
): ScheduleStore;
```

Único llamador: `Dependencies.ts` (ADR: aceptamos reordenar — solo hay un call-site). Call-sites internos:

| Línea | Hoy (fachada) | Después |
|---|---|---|
| 16 | `import { EnergyRecord, getEnergyHistory, getEnergyPatternOverride, saveEnergyPatternOverride } from '../persistence/EnergyHistoryService'` | `import { EnergyRecord } from '../../application/ports/out/EnergyRepository'` (solo el type; las 3 funciones vienen del parámetro) |
| 204 | `await getEnergyPatternOverride()` | `await energyRepository.getPatternOverride()` |
| 348 | `await saveEnergyPatternOverride(pattern)` | `await energyRepository.savePatternOverride(pattern)` |
| 378 | `const historial = await getEnergyHistory(14)` | `const historial = await energyRepository.history(14)` — **sin tocar `historial[0]`** (ADR-7) |

## Data Flow

Guarda de energía (PR2 final): usuario → hook → store → repositorio → regeneración.

```
Usuario ──moveEnergy()──▶ useEnergyCheckIn ──setEnergyIndex──▶ state (energyIndex)
                                                            │ hayCambios
          ──tap "Guardar"──▶ handleSaveEnergy ──Alert.confirm──┐
                                                   "Sí, actualizar"
                    ──guardarNivel(nivel, 30)──▶ EnergyStore (createEnergyStore)
                           │ 1. repository.save(makeEnergyRecord(nivel))   save ANTES que refresh
                           │ 2. repository.history(30)                     historial fresco
                           ▼
                    historial = history(30)  ──▶ setHistorialEnergia (local del hook)
                           │ reflexion = reflexionar(nivel, historial)  (dominio puro)
                           ▼
                    setReflexion  (queda aunque la regeneración falle)
                           │
                    ──onRegenerate({nivel_energia, historial_energia}, true)──▶ useScheduleStore
                           └─ handleGenerateSchedule ──▶ generateScheduleUseCase.execute ──▶ set(schedule)
    fallo en (1)/(2) ──▶ rechaza ──▶ catch del hook ──▶ console.error (UI intacta, selección conservada)
    fallo en regenerate ──▶ console.error del store (reflexión YA visible)
```

## File Changes

### PR1 — capas (PR a main, reversible solo)

| File | Acción | Descripción |
|---|---|---|
| `src/application/utils/dateTime.ts` | Create | `fechaLocal` consolidada (ADR-5) |
| `src/infrastructure/store/useEnergyStore.ts` | Create | `createEnergyStore` + `EnergyStore` + `makeEnergyRecord` (ADR-1/2) |
| `src/infrastructure/store/__tests__/useEnergyStore.test.ts` | Create | Orden save→history, días por llamador (30/14), patrón, rechazo — `createEnergyStore(mockRepo)` + `getState()`, sin jest.mock ni renderer |
| `src/di/Dependencies.ts` | Modify | `energyRepository` flag-driven (patrón idéntico a `activityRepository:51-53`), `export const useEnergyStore = createEnergyStore(energyRepository)`, re-exports de los 5 stores (bloque con comentario ADR-3/4), `energyRepository` como 4º arg de `createScheduleStore` (línea 90-97) |
| `src/infrastructure/store/useScheduleStore.ts` | Modify | Parámetro + 3 call-sites + import del port (tabla arriba) |
| `src/presentation/screens/Home/HomeView.tsx` | Modify | V1 mecánico (call-site, NO hook aún): init 152-178 usa `useEnergyStore.getState().cargarHistorial(30)`; guardado 316-335 usa `guardarNivel(nivel, 30)` retornando el historial para reflexión/regenerate; se elimina `historialEnergia` (estado hoy sin lecturas); `fechaLocal` import nuevo |
| `src/presentation/screens/Schedule/ScheduleView.tsx` | Modify | V2: 266-281 → `const historial = await useEnergyStore.getState().guardarNivel(nivel, 14);` (import de DI; borra 14-18); línea 23 `useCalendarStore` → DI |
| `src/presentation/screens/Settings/SettingsView.tsx` | Modify | V3: 84 → `useEnergyStore.getState().cargarPatronManual()` + suscripción a `patronManual`; 310 → `guardarPatronManual(opt.value)` (se conserva 311 `setCustomEnergyPattern`, ADR-10); 16 `useAuthStore` → DI |
| `src/presentation/screens/AIChat/AIChatView.tsx` | Modify | V8: borrar línea 5 (`warmUpBackend`) y el useEffect 14-16; `import { useBackendWarmUp } from '../../hooks/useBackendWarmUp'` + llamada en el cuerpo. VERIFICADO: `App.tsx:22` ya monta el hook en la raíz (warm en launch + foreground); el call de la pantalla se REEMPLAZA (no se elimina): conserva el warm de montaje de la pantalla (throttle hace el duplicado inofensivo) y AÑADE re-warm al foreground mientras el chat está montado (spec §6, mejora aceptada). Tras el cambio, `useEffect` de línea 1 se conserva solo si queda en uso en el resto del archivo — verificar con tsc |
| `src/presentation/components/theme/colors.tsx`, `src/presentation/components/organisms/Onboarding/OnboardingVIew.tsx`, `src/presentation/navigation/AppNavigator.tsx` (18-19) | Modify | V7: `useAppStore`/`useAuthStore` → `../../../di/Dependencies` (rutas relativas según profundidad) |
| `src/presentation/screens/Auth/LoginView.tsx` (15), `SignUpView.tsx` (15) | Modify | V7: `useAuthStore` → DI |
| `src/presentation/screens/Activity/activityCreation/CreateActivityView.tsx` (37) | Modify | V7: `useWizardDraftStore` → DI |
| `src/presentation/screens/Stats/StatsView.tsx` (8-9) | Modify | V5: `fechaLocal` → application/utils; `useRewardsStore` QUEDA directo (V11) |
| `src/presentation/components/organisms/Schedule/MonthGrid.tsx` (5) | Modify | V6: `aFechaLocal` → `fechaLocal` (app utils); `Ocurrencia` queda type-only de CalendarApiService (V10) |
| `src/infrastructure/api/RewardsApiService.ts` | Modify | Borrar definición local 53-57; import de application/utils |
| `src/infrastructure/api/CalendarApiService.ts` | Modify | Borrar `aFechaLocal` 30-34 (verificado: sin usos internos); `Ocurrencia` y exports intactos |
| `src/infrastructure/store/useRewardsStore.ts` (11), `useFocusSessionStore.ts` (12), `useCalendarStore.ts` (6) | Modify | V5: import de application/utils |
| `src/infrastructure/store/__tests__/useRewardsStore.test.ts` (23), `useCalendarStore.test.ts` (17), `src/presentation/screens/Stats/__tests__/StatsView.test.tsx` (18) | Modify | Ajuste: mocks de `fechaLocal` apuntan al módulo nuevo |
| `src/infrastructure/persistence/EnergyHistoryService.ts` | Delete | ÚLTIMO paso de PR1 (ADR-6): tras tsc+tests verdes y `rg "EnergyHistoryService" src/` = cero |
| `src/config/featureFlags.ts` | Modify | Retoque 8-10: la razón de "vive suelto" ya no cita la fachada; el flag sigue en `config/` porque `SchedulePersistenceAdapters` (módulo que `Dependencies` importa) y `useChatStore` lo consultan |
| `src/presentation/screens/Home/HomeView.tsx` | Modify | V5: `fechaLocal` → application/utils (junto al swap V1) |
| `App.tsx` | — | SIN cambios (ya usa el hook en raíz) |

### PR2 — hooks + tests (PR a main, reversible solo)

| File | Acción | Descripción |
|---|---|---|
| `src/presentation/utils/scheduleUtils.ts` | Modify | Export `toMinutes(time: string): number` (ADR-11) |
| `src/presentation/hooks/useNow.ts` | Create | Ticker 10 s (default) |
| `src/presentation/hooks/useTodayTimeline.ts` | Create | Derivación pura con `ahora` inyectado |
| `src/presentation/hooks/useDayClose.ts` | Create | Cierre de día (ADR-9) |
| `src/presentation/hooks/useEnergyCheckIn.ts` | Create | Flujo de energía completo (dueño del Alert) |
| `src/presentation/hooks/useHomeDashboard.ts` | Create | Agregación de stores + efectos de montaje |
| `src/presentation/hooks/__tests__/useNow.test.tsx` | Create | Fake timers; `minutosDelDia` cruzando hora; Probe + `act()` |
| `src/presentation/hooks/__tests__/useTodayTimeline.test.ts` | Create | Fixtures `new Schedule({...})`; escenarios spec 13-16 (viaje excluido, per-day, cruce de semana, horas libres) |
| `src/presentation/hooks/__tests__/useDayClose.test.tsx` | Create | 19:59 vs 20:00 (`HORA_DE_CIERRE`); mismo día no re-ofrece; `cerrar` rechaza → `diaCerrado` queda |
| `src/presentation/hooks/__tests__/useEnergyCheckIn.test.tsx` | Create | Init preselección/vacío/reflexión persistente; orden save→refresh→reflexión→regenerate último; cancelar revierte; `Alert` espiado |
| `src/presentation/hooks/__tests__/useHomeDashboard.test.tsx` | Create | `cargarLogros` al montar; auto-generación (esc. 17); `onTerminar` → `cargarLogros` y fallo conserva sesión (esc. 18) |
| `src/presentation/screens/Home/HomeView.tsx` | Modify | Consume los 5 hooks; quedan: JSX + estilos + `useFocusEffect(loadActivities)` + selectores de pasarela (`startHour`, `perDayStartHours` de schedule; `progreso.completadosIds`/`noHechasIds` de rewards — el JSX ya usa `completadas`) + `rachaNueva` derivado. Target < 600 L |

Dependencias de hooks: dominio puro aceptado (política de layers: `reflexionar`, `correspondeOfrecerCierre`, `sinResponder`); presentation utils (`scheduleUtils`); DI para stores; `useRewardsStore` directo (V11); types desde infra (V10). Cero imports `src/presentation/** → src/infrastructure/**` nuevos fuera de las 3 excepciones.

## Testing Strategy

| Capa | Qué | Cómo |
|---|---|---|
| Unit — store | Orden `guardarNivel` (save antes que history), retorno fresco, días 30/14 sin default propio, patrón carga/guarda, rechazo propaga | `createEnergyStore(mockRepo)` con `mockRepo.save`/`history` forwarders (`jest.fn()`), `getState()`, convención `useRewardsStore.test.ts`, sin renderer ni jest.mock de módulos |
| Unit — hooks | Ticker (fake timers); timeline puro (fixtures); cierre 19:59/20:00; init/preselección/reflexión; guardado con orden; cancel; efectos de dashboard; wiring focus | Probe + `act()` (React 19), acciones inyectadas por parámetro (sin jest.mock); seed con `setState` de singletons; descripciones en español |
| Regression — ajustes | `useRewardsStore.test.ts`, `useCalendarStore.test.ts`, `StatsView.test.tsx` | Mocks de `fechaLocal` repuntan al módulo nuevo |
| Verify — capas | `rg "infrastructure" src/presentation/` → solo V9/V10/V11; `rg "EnergyHistoryService"` → cero | Grep en verify-report |
| Verify — R0 | `rg "querés\|podés\|tenés\|hacé\|elegí\|contame"` sobre strings nuevos/modificados | Grep en verify-report |

## Migration / Rollout

No hay migración de datos ni flags nuevos: comportamiento idéntico, mismo repositorio, `USA_BACKEND_PARA_DATOS` gobierna el adaptador (ahora desde `Dependencies`). Rollback: revertir PR1 o PR2 por separado (`EnergyHistoryService` reaparece si se revierte PR1; se borra en el ÚLTIMO commit de PR1, nunca antes).

## Implementation Plan (stacked-to-main)

**PR1 — capas** (orden de commits con verificación propia; cada commit deja tsc+tests verdes):
1. `dateTime.ts` + borrado de defs locales + swaps de imports (Rewards/Calendar/Focus/CalendarStore/Stats/MonthGrid + 3 tests ajustados) → `pnpm tsc --noEmit` && `pnpm test`
2. Re-exports en `Dependencies.ts` + swaps V7 (colors, Onboarding, AppNavigator, Login, SignUp, CreateActivity, ScheduleView, SettingsView) → tsc + tests
3. `useEnergyStore.ts` + creador de tests + `energyRepository` flag-driven y `useEnergyStore` en DI → tsc + `pnpm test` (test nuevo verde)
4. `createScheduleStore(energyRepository)` + 3 call-sites + import del port → tsc + tests
5. Swaps de energía: ScheduleView (V2), SettingsView (V3), HomeView (V1 mecánico) + AIChatView (V8) → tsc + tests
6. Gate: `pnpm tsc --noEmit` && `pnpm test` verdes && `rg "EnergyHistoryService" src/` cero → BORRAR fachada → retoque `featureFlags.ts` → tsc + tests

**PR2 — hooks** (extracción con test-pinning; orden: puros primero):
1. `scheduleUtils.toMinutes` export; `useNow` + test
2. `useTodayTimeline` + test
3. `useDayClose` + test
4. `useEnergyCheckIn` + test
5. `useHomeDashboard` + test
6. `HomeView` final: consumir los 5 hooks, borrar lógica extraída (incluido `toMinutes` local y `DIAS_DE_HISTORIAL`) → tsc + `pnpm test` + grep de capas + target < 600 L

## Open Questions

- [ ] Orden real del array `history()` del adaptador API backend (no verificable desde este repo). NO bloquea: ADR-7 preserva el comportamiento sea cual sea el orden.
- [ ] `useEffect` en `AIChatView` tras el swap V8: conservar solo si sigue en uso (tsc lo detecta).

## Verificación final del cambio

`pnpm tsc --noEmit` + `pnpm test` verdes; cero `src/presentation/** → src/infrastructure/**` salvo V9/V10/V11 (grep); `HomeView` < 600 L sin efectos/estado de datos; 7 archivos de test nuevos pasando; fachada inexistente; R0 limpio.