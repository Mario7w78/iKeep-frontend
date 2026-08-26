# Specification: Home Dashboard

## Intent

Extract the data logic of `HomeView` (energy check-in, day close, time ticker, today timeline, dashboard aggregation) into five testable hooks plus an injectable `createEnergyStore` factory, preserving the exact behaviors currently buried in the 1193-line screen. Hooks live FLAT in `src/presentation/hooks/` (confirmed decision).

## Requirements

### 1. Energy store factory (`createEnergyStore`)

- `createEnergyStore(repository: EnergyRepository)` MUST return a Zustand store exposing: `cargarHistorial(dias)`, `guardarNivel(nivel, dias)`, `reportadoHoy()`, `cargarPatronManual()`, `guardarPatronManual(patron)`, and the pure `makeEnergyRecord` colocated with it.
- Every history-bound action MUST take an explicit `dias` argument from the caller: 30 for Home, 14 for Schedule, 14 for reschedule. The store MUST NOT apply its own window default.
- `cargarHistorial` MUST fetch without writing store state.
- `guardarNivel` MUST persist the record BEFORE refreshing history, and MUST resolve with the refreshed history for the requested `dias`.
- The store MUST NOT hold shared `historial` state: Home and Schedule are co-mounted in the tab navigator with different windows (30 vs 14); the store SHALL expose actions only, leaving local state to consumers.
- Failures of `guardarNivel` MUST reject so the UI can react.

### 2. `useEnergyCheckIn`

- On mount MUST preselect the last level from the 30-day history (`idx = ultimo.nivel - 1`, clamped to the level range); if history is empty MUST preselect index 1 (stable).
- If the user already reported today, the reflection MUST persist when reopening (init computes `reflexionar(ultimo.nivel, historial)`).
- On save confirmation MUST call `guardarNivel(nivel, 30)`, compute the reflection from the REFRESHED history, and ONLY THEN invoke `onRegenerate({nivel_energia, historial_energia}, true)` as the LAST step — the reflection must appear even if regeneration fails.
- On cancel MUST revert `energyIndex` to `savedEnergyIndex`.

### 3. `useDayClose`

- MUST mark the day closed BEFORE awaiting the server: if `cerrar` rejects, `diaCerrado` MUST remain set (the store reverts and logs; the prompt MUST NOT be re-offered).
- MUST NOT re-offer on the same day: `yaCerro` when `diaCerrado === hoyISO`.
- Rejecting (`onCerrar`) MUST also mark the day closed without any server call.
- MUST derive `hoyISO` via `fechaLocal` from `application/utils/dateTime`.

### 4. `useNow`

- MUST expose `ahora: Date` and `minutosDelDia`, refreshing on an interval of `intervalMs` (default 10000 ms) and clearing the interval on unmount.

### 5. `useTodayTimeline`

- MUST be a pure derivation with `ahora` INJECTED as a parameter (no `new Date()` inside), enabling deterministic tests.
- MUST derive: `todayItems` (per-day start from `perDayStartHours` with fallback to `startHour`), `currentActivity` (inclusive start/end), `nextActivities` (start > current minutes AND `activity` defined AND `tipo !== 'viaje'`), `firstNext`, `nextDayWithItems` (lookahead 1..7 crossing the weekday boundary, same per-day fallback, `viaje` excluded), `minutesLeft` (clamped ≥ 0), `freeTimeMinutes`, and `sinResolver`.
- `freeTimeMinutes` MUST be null unless in free state (no current activity, no upcoming, schedule present); with no items today → minutes to midnight; all items done → from last end time to midnight.

### 6. `useHomeDashboard`

- MUST aggregate the five stores with defaults injected from DI, exposing `{ username, schedule, activities, cargandoActividades, racha, progreso, diasTerminados, alternarCompletada, cargarLogros, autoGenerarAlCargar, sesion, focusActions }`.
- On mount MUST call `cargarLogros()`.
- MUST auto-generate the schedule when `isLoadedFromStorage && activities.length > 0 && schedule === null`.
- Focus wiring: `onTerminar` MUST `await terminarSesion()` then `await cargarLogros()`; if it throws, the session MUST remain in the store.

### 7. Hook location

- The five hooks MUST live flat in `src/presentation/hooks/` (no subfolders), with tests in `src/presentation/hooks/__tests__/`.

## Scenarios

### Scenario 1: `guardarNivel` persists before refreshing (Happy Path)

- GIVEN `createEnergyStore(mockRepo)` with call-order tracking
- WHEN `guardarNivel(3, 30)` is called
- THEN the repository receives `save(record)` BEFORE `history(30)`
- AND the promise resolves with the refreshed 30-day history

### Scenario 2: `dias` propagated per caller

- GIVEN the store built with a mock repository
- WHEN `guardarNivel(2, 14)` is invoked (Schedule)
- THEN `history(14)` is called with the caller-provided window, never a store default

### Scenario 3: Co-mounted Home/Schedule keep independent windows

- GIVEN Home and Schedule both mounted, calling `cargarHistorial(30)` and `cargarHistorial(14)`
- WHEN either resolves
- THEN no shared state is written; each consumer retains its own list (30 vs 14 days)

### Scenario 4: Init preselects last reported level

- GIVEN a 30-day history whose last record has `nivel: 3`
- WHEN `useEnergyCheckIn` mounts
- THEN `energyIndex` is 2 and `savedEnergyIndex` is 2

### Scenario 5: Empty history defaults to stable

- GIVEN an empty 30-day history
- WHEN `useEnergyCheckIn` mounts
- THEN `energyIndex` and `savedEnergyIndex` are 1

### Scenario 6: Reflection persists when already reported today

- GIVEN the user reported today and reopens Home
- WHEN `useEnergyCheckIn` mounts
- THEN a reflection computed from the last level and the full history is shown

### Scenario 7: Save order — refresh, reflection, regenerate LAST

- GIVEN `energyIndex` changed and the user confirms
- WHEN the save flow runs
- THEN `guardarNivel(nivel, 30)` resolves first, the reflection is computed from the REFRESHED history, and `onRegenerate({nivel_energia, historial_energia}, true)` is invoked last
- AND the reflection is visible even if `onRegenerate` rejects

### Scenario 8: Cancel reverts selection

- GIVEN `energyIndex = 2` and `savedEnergyIndex = 0`
- WHEN the user cancels the confirmation dialog
- THEN `energyIndex` returns to 0

### Scenario 9: Mark-closed-before-server

- GIVEN `cerrar` rejects (network failure)
- WHEN the user answers the day-close prompt
- THEN `diaCerrado` remains set and `cerrandoDia` returns to false
- AND the same-day prompt is not offered again

### Scenario 10: Rejecting also closes the day

- GIVEN the day-close prompt is visible
- WHEN the user taps "cerrar" (reject)
- THEN `diaCerrado` is set to `fechaLocal()` without any server call

### Scenario 11: Same-day no re-offer

- GIVEN `diaCerrado === hoyISO`
- WHEN `correspondeOfrecerCierre` is evaluated
- THEN `ofrecerCierre` is false regardless of unresolved items

### Scenario 12: Ticker

- GIVEN `useNow()` with default `intervalMs` under fake timers
- WHEN 10 s elapse
- THEN `ahora` updates and `minutosDelDia` reflects the new wall-clock time (including across an hour boundary)

### Scenario 13: Deterministic timeline with injected `ahora`

- GIVEN a schedule fixture and a fixed `ahora` (e.g. Wednesday 13:30)
- WHEN `useTodayTimeline` derives
- THEN `todayItems`, `currentActivity`, `nextActivities` and `nextDayWithItems` are computed from `ahora` only

### Scenario 14: `viaje` excluded from upcoming

- GIVEN today's items include a VIAJE block and a real activity after it
- WHEN `nextActivities` is derived
- THEN the VIAJE block is absent and the real activity is present

### Scenario 15: Per-day start and crossing-weekday lookup

- GIVEN `perDayStartHours` overrides some days and `startHour` covers the rest
- WHEN the timeline is derived
- THEN each day uses its own start hour, falling back to `startHour`
- AND a next-day search from Sunday finds items on Monday

### Scenario 16: Free time rules

- GIVEN no current activity, no upcoming, and no items today
- WHEN `freeTimeMinutes` is derived
- THEN it equals minutes from now to midnight
- AND with all items done, it equals minutes from the last end time to midnight

### Scenario 17: Auto-generation condition

- GIVEN `isLoadedFromStorage = true`, `activities.length > 0`, `schedule === null`
- WHEN the dashboard mounts
- THEN `handleGenerateSchedule` is invoked

### Scenario 18: Focus termination refreshes rewards

- GIVEN an active focus session and `onTerminar` invoked
- WHEN `terminarSesion()` resolves
- THEN `cargarLogros()` runs after it
- AND if `terminarSesion()` rejects, the session remains in the store
