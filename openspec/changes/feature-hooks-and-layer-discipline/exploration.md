# Exploration: feature-hooks-and-layer-discipline

## Goals

1. Decompose `src/presentation/screens/Home/HomeView.tsx` (1193 lines, god component) into 3–5 testable custom hooks with clear inputs/outputs and stable dependencies.
2. Inventory and fix layering violations: every file under `src/presentation/` importing `src/infrastructure/*` or `src/domain/*` directly.
3. Reuse existing DI/store/hook/testing patterns (`src/di/Dependencies.ts`, Zustand store factories, jest + RNTL conventions).

Scope: HomeView hooks + closing layering violations across presentation. ScheduleView/SettingsView refactors are OUT (listed as future wave only).

---

## 1. HomeView decomposition

### Anatomy of `src/presentation/screens/Home/HomeView.tsx` (1193 lines)

| Range | Content | Logic? |
|---|---|---|
| 1–100 | Imports, constants (`DIAS_DE_HISTORIAL=30`, `makeEnergyLevels`, `dayFormatter`, `toMinutes`, `DAY_DISPLAY_NAMES`) | static |
| 102–134 | Component start: theme, styles, **store subscriptions (5 stores)** | read-only |
| 136–140 | `useEffect`: `cargarLogros()` on mount | yes |
| 142–178 | **Energy check-in state + init**: `energyIndex`, `savedEnergyIndex`, `historialEnergia`, `reflexion`; init effect reads `getEnergyHistory(30)`, preselects last level, computes `reflexionar(...)` | yes |
| 180–184 | `useFocusEffect`: `loadActivities()` | yes |
| 186–190 | **Schedule auto-generation**: if `isLoadedFromStorage && activities.length > 0 && schedule === null` → `handleGenerateSchedule()` | yes |
| 192–197 | `todayItems` (via `schedule.getItemsByDay` + `perDayStartHours`/`startHour`) | yes |
| 199–206 | **Time ticker**: `currentTime` state, `setInterval` 10 s | yes |
| 208–227 | `currentMinutes`, `currentActivity`, `nextActivities`, `firstNext` | yes |
| 231–240 | `sinResolver` via `sinResponder` (pure domain fn) | yes |
| 242–252 | **Day-close state**: `diaCerrado`, `cerrandoDia`; `hoyISO = fechaLocal()`, `ofrecerCierre = correspondeOfrecerCierre(...)` | yes |
| 254–269 | `nextDayWithItems` (next day with items loop) | yes |
| 271–287 | `minutesLeft`, `freeTimeMinutes` | yes |
| 289–340 | **Energy save flow**: `moveEnergy`, `handleSaveEnergy` (Alert → `saveEnergyRecord(makeEnergyRecord(nivel))` → refresh history → `reflexionar` → `handleGenerateSchedule({nivel_energia, historial_energia}, true)`) | yes |
| 344–387 | Card presentation helpers: `getIdentityLabel`, `isCurrentTravel`, `cardStatus`, `currentCardTitle`, `formatMinutesRemaining` | presentational |
| 394–432 | Loading / empty states (early returns) | presentational |
| 434–799 | JSX: `Celebration`, `FocusSession` wiring (446–466, incl. `terminarSesion` → `cargarLogros`), `DayClose` wiring (468–488, `onResponder` → `cerrar(...)`), energy card (521–574), estado INFACTIBLE/DESCONOCIDO cards (577–614), current-activity card (616–666), "algo cambió" card (668–689), next-schedule timeline (691–770), `ActivityDetailModal` (771–777), FABs (780–797) | presentational |
| 801–1193 | `createStyles` (~390 lines) | none |

### Store subscriptions (lines 111–134) — mixed import styles

| Store | Selectors | Imported from |
|---|---|---|
| `useScheduleStore` | `schedule`, `isLoadedFromStorage`, `handleGenerateSchedule`, `startHour`, `perDayStartHours` | `../../../di/Dependencies` (line 17) |
| `useActivityStore` | `activities`, `loadActivities`, `isLoading` | `../../../di/Dependencies` (line 17) |
| `useAppStore` | `username` | `infrastructure/store/useAppStore` (line 18) |
| `useFocusSessionStore` | `sesion`, `iniciarSesion`, `anotarSalida`, `terminar`, `descartar`, `guardando` | `infrastructure/store/useFocusSessionStore` (line 28) |
| `useRewardsStore` | `racha`, `progreso`, `cargar`, `completadosIds`, `noHechasIds`, `alternar`, `diasTerminados`, `cerrar` | `infrastructure/store/useRewardsStore` (line 33) |

**Testing today: none.** There is no `__tests__` under `screens/Home/`. The only unit coverage of these flows lives in the domain layer (`dayCloseTiming.test.ts`, `pendingAnswers.test.ts`, `energyReflection.test.ts`, `focusSession.test.ts`). Every extraction must therefore be judged by behavior preservation, not by existing tests — the refactor IS the opportunity to add the first regression net.

### Proposed hook boundaries (5 hooks + 1 store facade)

| # | Hook | Extracts (lines) | Inputs (props/params) | Internal state | Deps (injected for tests) | Outputs |
|---|---|---|---|---|---|---|
| 1 | `useEnergyCheckIn` | 142–178, 289–340 | `onRegenerate(energyData, showAlert)` (from schedule store), `niveles` count (=3) | `energyIndex`, `savedEnergyIndex`, `historialEnergia`, `reflexion` | `guardar(nivel)`, `historial(dias)` — repository functions injected as params; `reflexionar` (pure domain, stable) | `{ energyIndex, savedEnergyIndex, reflexion, moveEnergy, handleSaveEnergy, hayCambios }` |
| 2 | `useDayClose` | 242–252, 468–488 | `pendientes` (count), `cerrar` action from rewards store | `diaCerrado`, `cerrandoDia` | `fechaLocal` (moved to presentation utils), `correspondeOfrecerCierre` (pure domain), `ahora` (injected clock) | `{ ofrecerCierre, cerrandoDia, onCerrar, onResponder }` |
| 3 | `useNow` (ticker) | 199–206 | none | `currentTime` | none (or `intervalMs` param) | `{ ahora, minutosDelDia }` |
| 4 | `useTodayTimeline` | 192–197, 208–287 | `schedule`, `startHour`, `perDayStartHours`, `completadas`, `noHechas`, `minutosDelDia` | none (pure derivation) | `sinResponder`, `JS_DAY_TO_DAYOFWEEK`, `toMinutes` (all pure/static) | `{ todayItems, currentActivity, nextActivities, firstNext, nextDayWithItems, minutesLeft, freeTimeMinutes, sinResolver }` |
| 5 | `useHomeDashboard` (store facade) | 111–134, 136–140, 186–190, 446–466 | none (stores with defaults) | none | stores (default = singleton; overridable in tests) | `{ username, schedule, activities, racha, progreso, sesion, cargarLogros, autoGenerarAlCargar, focusActions }` |

Rationale:

- **`useEnergyCheckIn`** is the biggest cohesive unit (3 state fields, async init, save flow with 2 infra calls + 1 store call + pure reflection). Its save flow (lines 300–340) has a subtle ordering contract — reflection computed from the *refreshed* history, regenerate called last — that deserves a unit test.
- **`useDayClose`** is a self-contained daily-flow state machine (offer → respond → mark closed → call `cerrar`). Pure inputs, pure outputs, trivial to test with a fake clock.
- **`useTodayTimeline`** is pure derivation with zero state (feeds the current-card, timer, free-time, next-schedule, and day-close sections). Highest value-per-line test target: today-items filtering, "free state" edge cases (no activities today vs all done, lines 276–287).
- **`useNow`** separates the only `setInterval` in the file so timeline tests can drive it with fake timers.
- **`useHomeDashboard`** centralizes the 5-store subscription + mount effects (logros load, auto-generate, focus-session wiring). It is the boundary where the accepted store-import pattern gets a single home; overridable store params make the whole screen testable without jest.mock gymnastics.

**Not extracted**: `createStyles` (pure presentational), card helpers (they can move to the timeline hook outputs or stay inline).

---

## 2. Layering violations inventory

Rule applied: **presentation MAY import domain types and pure domain services; it MUST NOT import infrastructure** (stateful/IO must arrive via stores, hooks, or DI). Inventory below = every presentation file importing `infrastructure/*` or `domain/*`, with verdict.

### 2.1 Real violations — infrastructure imported by presentation

| # | File:line | Symbol | Source module | Why it's a violation | Cleanest fix candidate |
|---|---|---|---|---|---|
| V1 | `HomeView.tsx:36–40` | `saveEnergyRecord`, `makeEnergyRecord`, `getEnergyHistory` | `infrastructure/persistence/EnergyHistoryService.ts` | Screen reaches behind application layer straight into a persistence facade; the facade self-instantiates its repository from a feature flag (no DI) | New `useEnergyStore` (factory `createEnergyStore(repository)` wired in `Dependencies.ts`, following `createScheduleStore`); Home hook consumes store actions. Facade can remain as internal shim or be retired |
| V2 | `ScheduleView.tsx:15–18` | `saveEnergyRecord`, `makeEnergyRecord`, `getEnergyHistory` | same | Same as V1 (energy picker at line 271) | Same store — ScheduleView becomes a secondary consumer for free |
| V3 | `SettingsView.tsx:25` | `saveEnergyPatternOverride`, `getEnergyPatternOverride` | same | Same facade, same problem | Same store (`patronManual` state + actions) |
| V4 | `useScheduleStore.ts:16,378` + `loadDayLimits` | `getEnergyHistory`, `getEnergyPatternOverride`, `saveEnergyPatternOverride` | same | Store bypasses DI (imports facade directly instead of receiving repository as factory param) | Factory param: `createScheduleStore(..., energyRepository)` or read from new energy store |
| V5 | `HomeView.tsx:34`, `StatsView.tsx:8` | `fechaLocal` | `infrastructure/api/RewardsApiService.ts` | Pure date helper (line 53–57, no IO) living in an API module; screens import an API service for a string formatter | Move to `src/presentation/utils/timeUtils.ts` (or neutral `src/application/utils`); re-export from `RewardsApiService` to avoid touching its other consumers (`useRewardsStore`, `useFocusSessionStore`) |
| V6 | `MonthGrid.tsx:5` | `aFechaLocal` (function), `Ocurrencia` (type) | `infrastructure/api/CalendarApiService.ts` | Same as V5 — function import from API service | Move `aFechaLocal` beside `fechaLocal`; keep type-only `Ocurrencia` import (type-only is acceptable) |
| V7 | `HomeView.tsx:28`, `:33`; `StatsView.tsx:9`; `AIChatView.tsx:7`; `CreateActivityView.tsx:37`; `LoginView.tsx:15`; `SignUpView.tsx:15`; `SettingsView.tsx:16`; `AppNavigator.tsx:18–19`; `OnboardingVIew.tsx:18`; `colors.tsx:2` | `useFocusSessionStore`, `useRewardsStore`, `useWizardDraftStore`, `useAuthStore`, `useAppStore`, `useCalendarStore` (ScheduleView:23) | `infrastructure/store/*` | Store singletons imported directly; inconsistent with `useScheduleStore`/`useActivityStore` which come from `di/Dependencies` | **Accepted pattern today** (per orchestrator). Cheap consistency fix: re-export all stores from `di/Dependencies.ts` and update imports (no cycle risk: `Dependencies` does not import these singletons today — verify `useRewardsStore`'s `notificationScheduler` import stays). Full factory conversion = future wave |
| V8 | `AIChatView.tsx:5` | `warmUpBackend` | `infrastructure/api/apiConfig.ts` | Duplicates existing hook; direct infra call in screen | Replace with existing `useBackendWarmUp()` hook (the sanctioned wrapper) |
| V9 | `hooks/useBackendWarmUp.ts:4` | `warmUpBackend` | `infrastructure/api/apiConfig.ts` | Hook imports infrastructure | **Accept**: this is the sanctioned pattern — a hook is the presentation-facing wrapper of an infrastructure concern; `warmUpBackend` is pure/side-effect-throttled. Do NOT move it |
| V10 | `DayClose.tsx:13` | `RespuestaDeCierre` | `infrastructure/api/RewardsApiService.ts` | Type-only import | Low priority: relocate the type to `src/application` (or domain) where the store's `cerrar` signature lives; or accept (type-only = no runtime coupling) |
| V11 | `useRewardsStore.ts:15` | `notificationScheduler` | `di/Dependencies.ts` | Store imports the composition root (inversion) | Note only: leave as-is; flag in design phase if touching rewards store |

### 2.2 Domain imports — verdict

| Category | Files | Verdict |
|---|---|---|
| **Type-only entity imports** (`DayOfWeek`, `DayConfig`, `PartitionConfig`, `timeType`, `Activity`, `ScheduledActivity`, `AreaDeVida`, `AREAS`, `OverlapConflictData`, `ComportamientoActividad`, `Flor`) | ~25 components/screens under `atoms`, `molecules`, `organisms`, `screens`, `hooks` (e.g. `DayButton.tsx:3`, `ActivityBlock.tsx:3`, `ActivityCard.tsx:7`, `HomeView.tsx:19`, `ScheduleView.tsx:13`) | **Accept** — type-only imports have zero runtime coupling; moving them behind the application layer adds boilerplate with no behavioral gain. Document as policy |
| **Pure domain services** (`correspondeOfrecerCierre` HomeView:29, `sinResponder` HomeView:30, `reflexionar` HomeView:42, `focusSession` FocusSession.tsx:17, `lifeBalance` LifeFlower.tsx:5–6) | HomeView, FocusSession, LifeFlower | **Accept** — pure, deterministic, already unit-tested in `src/domain/services/__tests__/`. The hooks (1)–(4) above will keep importing them; they are the domain-layer part of hook logic |
| `HomeView.tsx:41` `EnergyRecord` | from `application/ports/out/EnergyRepository` | Type-only, fine |

### 2.3 The EnergyRepository question (explicit)

- The port exists: `src/application/ports/out/EnergyRepository.ts` (`save`, `history`, `reportedToday`, `getPatternOverride`, `savePatternOverride` + `EnergyRecord`).
- Two adapters implement it: `ApiEnergyRepository` (backend, `usa_backend` path) and `SupabaseEnergyRepository`.
- **`EnergyHistoryService.ts` is neither port nor adapter** — it is a *function-shaped facade* that picks an adapter from `USA_BACKEND_PARA_DATOS` at module scope (lines 20–22). Its own docstring admits the design debt (lines 12–15).
- Why it exists outside `Dependencies.ts`: `featureFlags.ts` comment (lines 7–10) explains the flag lives in `config/` because modules *imported by* `Dependencies` (like `EnergyHistoryService`) need it — placing the flag in `Dependencies` would cycle. This does **not** block wiring the *repository* through `Dependencies`: `Dependencies.ts` already imports `config/featureFlags` (line 40), and instantiating `new ApiEnergyRepository()` / `new SupabaseEnergyRepository()` there creates no cycle.
- **Recommendation**: export `energyRepository` from `Dependencies.ts` (same flag-driven selection), feed it into a new `createEnergyStore(...)` factory AND into `createScheduleStore(..., energyRepository)` as an optional param (replacing its direct facade imports at `useScheduleStore.ts:16`). `EnergyHistoryService` can then be deleted or kept as a deprecated shim re-exporting store actions — proposal phase to decide.

---

## 3. Existing patterns to reuse

### DI composition (`src/di/Dependencies.ts`, 109 lines)

- Flag-driven adapter selection at root (lines 51–63): `USA_BACKEND_PARA_DATOS ? new ApiX() : new SupabaseX()`.
- Use-cases instantiated with ports (65–82), then **store factories called with use-cases** (84–109): `createActivityStore(useCases)`, `createScheduleStore(generateUseCase, persistence, repository, reschedule, suggest, notifications)`, `createUserStore`, `createChatStore`.
- Stores NOT in DI: `useRewardsStore`, `useFocusSessionStore`, `useAppStore`, `useAuthStore`, `useCalendarStore`, `useWizardDraftStore` — plain `create()` singletons.

### Store patterns (`src/infrastructure/store/`)

- **Factory pattern** (`useScheduleStore.ts:118–125`): `export function createScheduleStore(useCases..., deps...)` → tested by injecting mocks. Store also imports `presentation/utils/scheduleUtils` (line 6) — an existing (questionable) cross-layer import, note only.
- **Singleton + persist** (`useFocusSessionStore.ts:46–104`): `create()` + `persist` middleware with `createJSONStorage(() => AsyncStorage)`, `partialize` to persist only `sesion`.
- **Singleton + direct API imports** (`useRewardsStore.ts:56`): `create()` calling `RewardsApiService` functions directly; also imports `notificationScheduler` from `di/Dependencies` and `sincronizarAvisos` use-case. Reintento-once logic lives in the store (lines 73–104).
- **State snapshots** (`useAppStore.ts:32`): pure UI prefs, persisted.

### Testing conventions

- Runner: **jest 29 + jest-expo preset** (`jest.config.js`), `@testing-library/react-native` 14, `@testing-library/jest-native`. Scripts: `pnpm test`, `pnpm typecheck` (`tsc --noEmit`).
- **Hook tests** (`useBackendWarmUp.test.tsx`): render a `Probe` component returning `null`; `jest.mock` the external module; `act()` for React 19 effect cleanup (lines 62–72); `jest.spyOn(AppState, 'addEventListener')` to capture the listener.
- **Store tests** (`useRewardsStore.test.ts`): `jest.mock` the API module with `mockX = jest.fn()` forwarders (lines 19–24), AsyncStorage mock (8–13), `setState` reset in `beforeEach`, plain `getState()` calls (no renderer needed for store logic).
- **Screen tests** (`StatsView.test.tsx`): mock `@expo/vector-icons` + AsyncStorage + API module; seed state via `useRewardsStore.setState(...)`; render the screen.
- **Domain tests**: pure function tests (`energyReflection.test.ts`, etc.).
- No path aliases — relative imports everywhere. No eslint configured; verify gate is `tsc --noEmit`.

---

## 4. Scope guard — future-wave candidates (NOT in this change)

| File | Lines | Why it's a future candidate |
|---|---|---|
| `ScheduleView.tsx` | 655 | Duplicates the energy flow (271–272: `saveEnergyRecord` + `getEnergyHistory(14)`) and the DI-vs-direct import mix; calendar/scroll logic. After this change it simply consumes the new energy store — the refactor then becomes mechanical |
| `SettingsView.tsx` | 574 | Energy pattern override (25), auth store, day limits — same layering fixes, larger surface (pickers, per-day config) |
| `MonthGrid.tsx` | 307 | `aFechaLocal` move is in-scope-adjacent (V6), but any deeper calendar-store refactor is not |
| `useTimeForm.ts` | 626 | Large hook, but belongs to CreateActivity flow — separate change |
| `useRewardsStore` / singleton store conversion to factories | — | Full DI conversion of remaining singletons; riskier, deserves its own change |

---

## 5. Testing strategy for the new hooks

1. **`useTodayTimeline` + `useNow`** (pure): build `Schedule` fixtures with `new Schedule({...})` (see `useScheduleStore.construirHorario` shape, lines 75–116); `jest.useFakeTimers()` for the ticker; assert current/next/free-time edge cases: no activities today (→ free to midnight), all done (→ free from last end), travel blocks, `perDayStartHours` override, next-day lookup across week boundary.
2. **`useEnergyCheckIn`**: render `Probe` with injected `guardar`/`historial` mocks; assert init preselects last level, save calls `guardar(nivel)` then refreshes history, `reflexionar` runs with the *refreshed* history, `onRegenerate` receives `{nivel_energia, historial_energia}` and `showAlert=true`; cancel path reverts `energyIndex` to `savedEnergyIndex`.
3. **`useDayClose`**: fake clock at 19:59 vs 20:00 (`HORA_DE_CIERRE`), `yaCerro` persistence (re-open same day does not re-offer), `onResponder` failure path keeps `diaCerrado` set (lines 474–487 behavior).
4. **`useHomeDashboard`**: overridable store params → assert mount effects (`cargarLogros`, auto-generate condition line 187) and focus-session wiring without jest.mock.
5. Follow existing conventions: `Probe` render + `act`, mock forwarders, `setState` seeding, Spanish test descriptions (repo style).

---

## 6. Risks

1. **Zero regression net for HomeView**: no screen/hook tests exist today; hook extraction can silently change behavior (e.g. effect ordering: logros load, auto-generate, energy init). Mitigation: extraction order = pure derivations first (timeline/now), then day-close, then energy (most coupled), each with tests written against current behavior.
2. **Energy flow contract**: `handleGenerateSchedule(energyData, showAlert)` is shared with ScheduleView (which uses 14-day history vs Home's 30) and `handleReschedule` also reads history (`useScheduleStore.ts:378`). A new energy store must preserve the per-caller day counts and the refresh-after-save ordering or schedule generation degrades.
3. **Store wiring churn**: introducing `createEnergyStore` + re-exporting singletons from `Dependencies` touches 4+ consumer files; `useRewardsStore` already imports `notificationScheduler` from `Dependencies` (line 15) — any new Dependencies export must be checked for import cycles (`featureFlags.ts:7–10` documents the historical cycle constraint).
4. **`fechaLocal`/`aFechaLocal` move** touches `RewardsApiService` internal default params, `useRewardsStore`, `useFocusSessionStore`, `StatsView`, `HomeView`, `MonthGrid` — mechanical but wide; keep re-export shims to avoid breaking untested consumers.

## 7. Open questions for proposal phase

1. New energy state: **full `useEnergyStore` factory** (matches `createScheduleStore`, testable) vs **function-injection into hooks** (smaller diff)? Recommendation: store factory — 4 consumers converge, matches existing patterns.
2. `EnergyHistoryService`: delete after migration, or keep as deprecated shim? (Consumers: HomeView, ScheduleView, SettingsView, useScheduleStore.)
3. Store imports policy: re-export all singleton stores from `di/Dependencies.ts` (consistency, one import boundary) — in scope? Recommendation: yes, it's the smallest discipline win; full factory conversion is the future wave.
4. Where do Home-specific hooks live: `src/presentation/hooks/` (flat, current convention) vs `src/presentation/hooks/home/`? Recommendation: flat, prefixed `use` — repo has no subfolders in hooks today.
5. Is moving `fechaLocal`/`aFechaLocal` to `src/presentation/utils/timeUtils.ts` in scope? (Pure relocation, 6 files, low risk — recommendation: yes.)
6. Confirm the accepted policy "presentation MAY import domain types and pure domain services" so the inventory verdicts (2.2) become spec-level rules.

---

## Ready for Proposal

**Yes.** All evidence collected; boundaries and fix candidates are concrete and scoped. The proposal phase should decide: (a) store-vs-injection for energy, (b) the store re-export policy, (c) the `fechaLocal` move, (d) `EnergyHistoryService` fate, then hand to design for hook signatures and DI wiring.
