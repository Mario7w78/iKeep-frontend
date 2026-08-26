# Propuesta: feature-hooks-and-layer-discipline

## Intent

La presentación tiene dos deudas que hoy se pagan juntas:

1. **`HomeView.tsx` (1193 líneas) no tiene ni un solo test** y mezcla 5 suscripciones a stores, 4 efectos (init de energía, logros, auto-generación, ticker), un flujo de guardado de energía con orden delicado y la máquina de estado del cierre de día. Toda la lógica que vale la pena conservar está enterrada en JSX.
2. **La capa de presentación importa infraestructura directamente** (11 violaciones inventariadas en la exploración): pantallas y stores llegan a `EnergyHistoryService` y a stores singleton sin pasar por `di/Dependencies.ts`. `EnergyHistoryService` es una fachada *fuera del DI* que se instancia su propio repositorio desde un flag — su propio docstring admite la deuda.

Esto NO es una reestructuración del core hexagonal: el dominio y la aplicación no cambian. Es disciplinar la frontera de presentación usando los patrones que el repo YA tiene: factories de stores (`createScheduleStore`, `createActivityStore`), inyección desde `Dependencies.ts`, y tests con jest + RNTL. El refactor ES la oportunidad de poner la primera red de regresión sobre estos flujos.

## Scope

### In Scope

- 5 hooks extraídos de `HomeView` (validados abajo) + tests unitarios.
- Nuevo `createEnergyStore(repository)` (factory Zustand) cableado en `Dependencies.ts`; el puerto `EnergyRepository` existente se convierte en la única vía.
- `createScheduleStore(..., energyRepository)` — el store de horario recibe el repositorio en vez de importar la fachada.
- Re-export de stores singleton desde `Dependencies.ts` (5 stores; `useRewardsStore` queda como excepción documentada, ver D2).
- `fechaLocal`/`aFechaLocal` → `src/application/utils/dateTime.ts` (una sola función; ver D3).
- Swaps de consumidores (solo puntos de llamada, sin reescribir): `HomeView`, `ScheduleView` (271-278), `SettingsView` (patrón manual), `MonthGrid`, `StatsView`, `AIChatView`, `CreateActivityView`, `LoginView`, `SignUpView`, `AppNavigator`, `OnboardingView`, `colors.tsx`.
- Borrado de `EnergyHistoryService` (último paso, ver D4) + retoque del comentario en `featureFlags.ts:8-10`.
- Tests nuevos para cada hook y para el store de energía.

### Out of Scope

- `ScheduleView` (655 L) y `SettingsView` (574 L) como targets de refactor — solo consumidores del nuevo store.
- Conversión de `useRewardsStore` y del resto de singletons a factories (ola futura; desbloquea la excepción de D2 y cierra V11).
- `useTimeForm` (626 L) — flujo de CreateActivity, cambio aparte.
- `MonthGrid` — cualquier refactor del calendar store más allá del swap de `aFechaLocal`.
- Capa de dominio intacta: `reflexionar`, `correspondeOfrecerCierre`, `sinResponder` siguen importándose directo desde presentación (política aceptada: puros y ya testeados).
- El puerto `EnergyRepository` no cambia (incluye `reportedToday`, hoy sin consumidores — se conserva).

## Decisiones (preguntas abiertas de la exploración)

### D1 — Estado de energía: factory de store (`createEnergyStore(repository)`)

**Decisión: store factory.** Justificación: es el patrón existente del repo (`createScheduleStore`/`createActivityStore` en `Dependencies.ts:84-109`); los 4 consumidores convergen en un solo objeto inyectable; se testea con `createEnergyStore(mockRepo)` + `getState()`, la convención de `useRewardsStore.test.ts`, sin `jest.mock` de módulos. La inyección de funciones en un hook deja a `ScheduleView`/`SettingsView` con cableado propio y duplica el contrato de orden save→refresh (hoy duplicado en `HomeView:300-340` y `ScheduleView:266-281`).

**Forma** (diseño fija firmas exactas):

```ts
// src/infrastructure/store/useEnergyStore.ts
interface EnergyStoreState {
  patronManual: string | null;   // para SettingsView
  cargando: boolean;
  cargarHistorial: (dias: number) => Promise<EnergyRecord[]>;          // sin escribir estado
  guardarNivel: (nivel: number, dias: number) => Promise<EnergyRecord[]>; // save → refresh(dias) → retorna
  reportadoHoy: () => Promise<boolean>;
  cargarPatronManual: () => Promise<void>;
  guardarPatronManual: (patron: string | null) => Promise<void>;
}
export function createEnergyStore(repository: EnergyRepository): EnergyStore;
```

- **Los días los pasa el llamador**: Home usa 30 (`DIAS_DE_HISTORIAL`), Schedule 14, `handleReschedule` 14. El contrato por llamador queda explícito en la firma.
- **El store NO guarda historial compartido en estado**: Home y Schedule viven montados a la vez en el tab navigator; un `historial` compartido se pisaría (30 vs 14 días). Los hooks/screens conservan su estado local exactamente como hoy; el store es la frontera inyectable que centraliza el orden save→refresh→retorno en UN solo lugar testable.
- `makeEnergyRecord` (puro) se muda junto al store.

### D2 — Política de re-export de stores

**Decisión: re-export desde `Dependencies.ts` de `useAppStore`, `useFocusSessionStore`, `useAuthStore`, `useCalendarStore`, `useWizardDraftStore`** (import + `export`), y los consumidores importan desde `../../../di/Dependencies` (mismo camino que `useScheduleStore`/`useActivityStore` hoy).

**Excepción verificada: `useRewardsStore` NO se re-exporta.** Ya importa `notificationScheduler` desde `Dependencies` (línea 15); re-exportarlo cerraría un ciclo `Dependencies → useRewardsStore → Dependencies` — exactamente la clase de fragilidad que documenta `featureFlags.ts:7-10`. Se mantiene como import directo desde `infrastructure/store/useRewardsStore` (estado actual), documentado como la ÚNICA excepción sancionada, con TODO a la ola futura de conversión a factory. Verifiqué que los otros 5 stores no importan de `Dependencies` → re-exportarlos es libre de ciclos.

El nuevo `useEnergyStore` sale de `Dependencies` sin riesgo: recibe el repositorio por parámetro (nunca importa `Dependencies`), y `Dependencies` ya importa `config/featureFlags` (línea 40) para la selección flag-driven del repositorio — la restricción de `featureFlags` no bloquea este cableado (exploración §2.3).

### D3 — Relocación de `fechaLocal`/`aFechaLocal`: IN SCOPE

Ambas son puras e idénticas (`RewardsApiService.ts:53-57` vs `CalendarApiService.ts:30-34`) → se consolidan en UNA función `fechaLocal(momento?: Date)` en **`src/application/utils/dateTime.ts`** (carpeta nueva, capa neutra).

**Por qué `application` y no `presentation/utils/timeUtils.ts`**: `useRewardsStore` y `useFocusSessionStore` (infraestructura) la consumen como default de sus acciones; en `application` ambos lados importan legalmente. Ponerla en `presentation` crearía un edge infra→presentation nuevo (el de `useScheduleStore.ts:6` ya existe pero está cuestionado — no se extiende). Los 4 consumidores directos se actualizan (useRewardsStore, useFocusSessionStore, HomeView, StatsView, MonthGrid); **no hacen falta shims de re-export** en los API services: se borran las definiciones locales. `Ocurrencia` (type-only) se queda en `CalendarApiService` — ver V10.

### D4 — Destino de `EnergyHistoryService`: BORRAR (tras migración completa)

Sus 4 consumidores migran (Home/Schedule/Settings → `useEnergyStore`; `useScheduleStore` → repositorio inyectado). Con cero consumidores, mantenerlo como shim deprecated deja DOS caminos al mismo repositorio y riesgo de divergencia (su propio docstring lo admite); la app no es API pública y git conserva el historial. **Secuencia obligatoria**: migrar consumidores → `pnpm tsc --noEmit` + tests verdes → borrar → actualizar el comentario de `featureFlags.ts` (el flag se queda en `config/`: aún lo importan `SchedulePersistenceAdapters` y `useChatStore`, módulos que `Dependencies` importa).

## Hooks propuestos (validación de los 5 de la exploración)

| # | Hook | Extrae | Entradas | Estado interno | Dependencias | Salidas |
|---|---|---|---|---|---|---|
| 1 | `useEnergyCheckIn` | 142-178, 289-340 | `onRegenerate` (schedule store), acciones del store de energía inyectables (default: `useEnergyStore` desde DI) | `energyIndex`, `savedEnergyIndex`, `historialEnergia`, `reflexion` | acciones del store, `reflexionar` (dominio puro) | `{ energyIndex, reflexion, moveEnergy, handleSaveEnergy, hayCambios }` |
| 2 | `useDayClose` | 242-252, 468-488 | `pendientes`, `cerrar` (rewards store), `hora` vía `useNow` | `diaCerrado`, `cerrandoDia` | `fechaLocal` (app utils), `correspondeOfrecerCierre` (dominio) | `{ ofrecerCierre, cerrandoDia, onCerrar, onResponder }` |
| 3 | `useNow` | 199-206 | `intervalMs = 10000` | `currentTime` | — | `{ ahora, minutosDelDia }` |
| 4 | `useTodayTimeline` | 192-197, 208-287 | `schedule`, `startHour`, `perDayStartHours`, `completadas`, `noHechas`, **`ahora` (ajuste)** | ninguno (derivación pura) | `sinResponder`, `JS_DAY_TO_DAYOFWEEK`, `toMinutes` (puros) | `{ todayItems, currentActivity, nextActivities, firstNext, nextDayWithItems, minutesLeft, freeTimeMinutes, sinResolver }` |
| 5 | `useHomeDashboard` | 111-134, 136-140, 186-190, 446-466 | stores inyectables (defaults: singletons DI) | ninguno | stores | `{ username, schedule, activities, cargandoActividades, racha, progreso, diasTerminados, alternarCompletada, cargarLogros, autoGenerarAlCargar, sesion, focusActions }` |

**Ajuste con justificación (hook 4)**: `todayItems` y `nextDayWithItems` usan `new Date().getDay()` (líneas 193, 256); se inyecta `ahora` desde `useNow` para hacerlos deterministas en test (freezar fecha con fake timers). Sin cambio de comportamiento.

**Contratos preservados (obligatorios en spec):**
- Init de energía: preselecciona el último nivel del historial de 30 días; historial vacío → índice 1; si ya reportó hoy, la reflexión persiste al reabrir (líneas 152-178).
- Guardado: `guardarNivel(nivel, 30)` → reflexión calculada con el historial REFRESCADO → `onRegenerate({nivel_energia, historial_energia}, true)` al final (la reflexión se calcula antes de regenerar a propósito); cancelar revierte `energyIndex` a `savedEnergyIndex` (289-340).
- Cierre de día: "marcar cerrado ANTES del servidor" (474-477) — si `cerrar` falla, `diaCerrado` queda puesto; mismo día no se vuelve a ofrecer (`yaCerro`); `onCerrar` (rechazar) también marca cerrado.
- Wiring de focus: `onTerminar` → `terminarSesion()` + `cargarLogros()`; si falla, el store conserva la sesión (446-466).
- Auto-generación: `isLoadedFromStorage && activities.length > 0 && schedule === null` (186-190).
- Lugar: `src/presentation/hooks/` plano (convención actual; hay `__tests__/`).

## Plan por violación (archivo → fix)

| # | Violación | Fix |
|---|---|---|
| V1 | `HomeView.tsx:36-40` → `EnergyHistoryService` | `useEnergyCheckIn` consume `useEnergyStore` (DI) |
| V2 | `ScheduleView.tsx:15-18` | `onGenerateWithEnergy` → `useEnergyStore.getState().guardarNivel(nivel, 14)`; solo el call-site (271-278) |
| V3 | `SettingsView.tsx:25` | `cargarPatronManual()` / `guardarPatronManual(p)` del store; solo call-site |
| V4 | `useScheduleStore.ts:16` (+204, 348, 378) | Parámetro **obligatorio** `energyRepository: EnergyRepository` en `createScheduleStore` (único llamador: `Dependencies.ts`; sin tests existentes que tocar); `EnergyRecord` pasa a importarse del port |
| V5 | `fechaLocal` en `RewardsApiService` | Mover a `application/utils/dateTime.ts`; actualizar `HomeView`, `StatsView`, `useRewardsStore`, `useFocusSessionStore` |
| V6 | `MonthGrid.tsx:5` `aFechaLocal` | Consolidar en `fechaLocal` (app utils); `Ocurrencia` queda type-only (aceptado) |
| V7 | Stores singleton directos (10 archivos) | Importar los 5 re-exportados desde `di/Dependencies`; `useRewardsStore` directo (excepción D2) |
| V8 | `AIChatView.tsx:5` `warmUpBackend` | Reemplazar por `useBackendWarmUp()` — añade re-warm al volver a foreground (comportamiento sancionado del hook; mejora aceptada) |
| V9 | `useBackendWarmUp.ts:4` | **ACEPTAR** — wrapper sancionado presentación↔infra |
| V10 | `DayClose.tsx:13` `RespuestaDeCierre` | **ACEPTAR** type-only (cero acoplamiento runtime); política documentada |
| V11 | `useRewardsStore.ts:15` ← `Dependencies` | **NOTA** — inversión existente; ola futura (factory) |

## Estrategia de testing

| Archivo de test | Qué cubre | Mocks |
|---|---|---|
| `src/infrastructure/store/__tests__/useEnergyStore.test.ts` | Orden `guardarNivel`: save ANTES que history; devuelve historial fresco; `dias` propagado (30 vs 14); `patronManual` carga/guarda; errores | `createEnergyStore(mockRepo)` — sin renderer |
| `src/presentation/hooks/__tests__/useNow.test.tsx` | Ticker 10 s; `minutosDelDia` cruzando hora | `jest.useFakeTimers()`, Probe |
| `src/presentation/hooks/__tests__/useTodayTimeline.test.ts` | Fixtures `new Schedule({...})`; sin actividades hoy → libre hasta medianoche; todo hecho → libre desde último fin; `viaje` excluido de `nextActivities`; `perDayStartHours`; día siguiente cruzando semana; `sinResolver` | ninguno (puro), `ahora` inyectado |
| `src/presentation/hooks/__tests__/useDayClose.test.tsx` | 19:59 vs 20:00 (`HORA_DE_CIERRE`); mismo día no re-ofrece; `onResponder` falla → `diaCerrado` queda | fake clock, `cerrar` mock |
| `src/presentation/hooks/__tests__/useEnergyCheckIn.test.tsx` | Init preselecciona último nivel (30 d); vacío → 1; orden save→refresh→reflexion→`onRegenerate(..., true)`; cancelar revierte | acciones del store inyectadas (params, sin jest.mock) |
| `src/presentation/hooks/__tests__/useHomeDashboard.test.tsx` | Efectos de montaje: `cargarLogros`; auto-generación; wiring focus (`onTerminar` → `cargarLogros`) | stores inyectados |
| Ajuste | `StatsView.test.tsx` — el mock de `fechaLocal` apunta al módulo nuevo | — |

Convenciones del repo: Probe + `act()` (React 19), forwarders `mockX = jest.fn()`, `setState` seeding, descripciones en español. Verificación: `pnpm tsc --noEmit` + `pnpm test`.

**Nota de entrega**: ~25 archivos, hooks + tests ≈ 1000+ líneas → **riesgo ALTO de presupuesto de 400 líneas**. Recomiendo PRs encadenados: **PR1** capas (store + DI + re-exports + `fechaLocal` + swaps de consumidores + borrado de fachada) y **PR2** hooks + tests (extracción con red de regresión).

## Capabilities

### New Capabilities
- `home-dashboard`: contratos de los 5 hooks y del `createEnergyStore` — init/preselección, guardado con días por llamador (30/14) y orden save→refresh→reflexion→regenerate, cierre de día (marcar antes del servidor, misma-día), timeline y ticker.
- `presentation-layering`: política de capas — presentación importa dominio (types + servicios puros) y stores vía DI; prohibido importar infraestructura; excepciones enumeradas (V9 hook sancionado, V10 type-only, V11 `useRewardsStore` hasta conversión).

### Modified Capabilities
- None (los specs existentes `settings.md`/`schedule_grid.md` no cambian de comportamiento — solo cableado).

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/presentation/screens/Home/HomeView.tsx` | Modificado | God component → consume 5 hooks; JSX + estilos quedan |
| `src/presentation/hooks/{useEnergyCheckIn,useDayClose,useNow,useTodayTimeline,useHomeDashboard}.ts` | **Nuevo** | Hooks extraídos |
| `src/presentation/hooks/__tests__/*` + `useEnergyStore.test.ts` | **Nuevo** | Red de regresión (7 archivos) |
| `src/infrastructure/store/useEnergyStore.ts` | **Nuevo** | Factory `createEnergyStore(repository)` + `makeEnergyRecord` |
| `src/di/Dependencies.ts` | Modificado | `energyRepository` flag-driven; `useEnergyStore`; re-exports (5 stores); param nuevo en `createScheduleStore` |
| `src/infrastructure/store/useScheduleStore.ts` | Modificado | Recibe `energyRepository` (3 call-sites) |
| `src/application/utils/dateTime.ts` | **Nuevo** | `fechaLocal` consolidada |
| `src/infrastructure/api/{RewardsApiService,CalendarApiService}.ts` | Modificado | Se eliminan definiciones locales de `fechaLocal`/`aFechaLocal` |
| `src/infrastructure/persistence/EnergyHistoryService.ts` | **Removido** | Borrado tras migración |
| `src/config/featureFlags.ts` | Modificado | Comentario actualizado |
| `ScheduleView`, `SettingsView`, `MonthGrid`, `StatsView`, `AIChatView`, `CreateActivityView`, `LoginView`, `SignUpView`, `AppNavigator`, `OnboardingView`, `colors.tsx`, `useRewardsStore`, `useFocusSessionStore` | Modificado | Imports (swaps) |

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Extracción con cero tests previos cambia comportamiento en silencio (orden de efectos) | Media | Orden de extracción: puros primero (`useNow`, `useTodayTimeline`), luego `useDayClose`, luego energía; cada uno con test contra el comportamiento actual |
| Contrato de energía degrada (días por llamador, orden de refresco) | Media | Firmas con `dias` explícito; `guardarNivel` centraliza el orden; tests de `useEnergyStore` + `useEnergyCheckIn` lo fijan |
| Ciclos de importación al tocar `Dependencies` (re-exports) | Baja | Verificado: 5 stores no importan de Dependencies; `useRewardsStore` excluida por ciclo; `useEnergyStore` recibe el repo por parámetro |
| Regresión en Schedule/Settings (sin tests de pantalla) | Media | Cambios restringidos a call-sites; contrato idéntico (mismas llamadas, otro origen) |
| Presupuesto de review (>400 líneas) | Alta | PRs encadenados PR1/PR2 con verificación propia |

## Rollback Plan

- Rama de feature: revertir el PR entero = volver al estado actual (sin migración de datos: comportamiento idéntico, mismo repositorio).
- **PR1 y PR2 reversibles por separado**: si los hooks regresan, se revierte PR2 y Home vuelve al componente original; si el cableado regresa, se revierte PR1 y `EnergyHistoryService` reaparece (se borra en el ÚLTIMO commit de PR1, nunca antes).
- `EnergyHistoryService` no se toca hasta que `pnpm tsc --noEmit` + `pnpm test` estén verdes con todos los consumidores migrados.

## Dependencies

- Ninguna nueva (Zustand, jest, RNTL ya presentes). Sin cambios de paquetes.

## Success Criteria

- [ ] `pnpm tsc --noEmit` y `pnpm test` verdes
- [ ] Cero imports `src/presentation/**` → `src/infrastructure/**` salvo las excepciones documentadas (V9, V10, V11) — verificable con grep
- [ ] `HomeView` < 600 líneas y sin efectos/estado de datos (solo JSX + estilos)
- [ ] Contratos preservados según la tabla de hooks (días 30/14, orden save→refresh→reflexion→regenerate, cerrar-antes-del-servidor) — fijados por los 7 archivos de test nuevos
- [ ] `EnergyHistoryService.ts` eliminado sin consumidores residuales
- [ ] Los 5 hooks con tests unitarios pasando

## Decisiones confirmadas (usuario)

1. **Excepción de `useRewardsStore` (D2) — ACEPTADA**: queda como único store con import directo desde `infrastructure/store` (ciclo de por medio), documentado como excepción sancionada hasta la ola futura de conversión a factory.
2. **`AIChatView` (V8) — CORREGIR**: se reemplaza `warmUpBackend` por `useBackendWarmUp()`; el re-warm al volver a foreground es una mejora de comportamiento aceptada.
3. **Política de capas — SÍ como regla de spec**: "presentation MAY import domain types + pure domain services; MUST NOT import infrastructure" con las excepciones enumeradas (V9 hook sancionado, V10 type-only, V11 `useRewardsStore`).
4. **Hooks en `src/presentation/hooks/` plano — CONFIRMADO** (convención actual, sin subcarpetas).
5. **División de PRs — CONFIRMADA**: PRs encadenados **PR1 (capas) / PR2 (hooks)** con estrategia **`stacked-to-main`** (cada PR mergea a main en orden, revertibles por separado).

### R0 — Español neutral en textos de la app (regla NUEVA del usuario)

**Regla obligatoria**: todo texto visible de la UI (etiquetas, mensajes, diálogos, placeholders, accesibilidad) debe escribirse en **español neutral, sin voseo** (nada de "querés", "podés", "tenés", "hacé", "elegí", "contame", etc.). Aplica a todo texto nuevo o modificado en este cambio y en adelante. Verificación: auditoría con grep de formas voseantes sobre strings de UI en el verify.
