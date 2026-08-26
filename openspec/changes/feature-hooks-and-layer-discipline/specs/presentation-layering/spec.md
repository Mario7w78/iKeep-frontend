# Specification: Presentation Layering

## Intent

Establish a normative dependency rule for the presentation layer and eliminate direct infrastructure imports. Presentation obtains stores and repositories exclusively through `di/Dependencies`; the exceptions are enumerated and sanctioned. The legacy `EnergyHistoryService` facade is deleted once every consumer migrates. All UI copy introduced or modified by this change is written in Neutral Spanish (no voseo).

## Requirements

### 1. Layer policy rule

- `src/presentation/**` MUST NOT import from `src/infrastructure/**`.
- `src/presentation/**` MAY import domain types and pure domain services from `src/domain/**`, and utilities from `src/application/**`.
- Screens, components and hooks MUST obtain stores and repositories via `src/di/Dependencies`; they MUST NOT construct or import adapters/repositories directly.

### 2. Sanctioned exceptions (exhaustive enumeration)

- V9: `useBackendWarmUp` SHALL remain a sanctioned presentation→infrastructure wrapper.
- V10: type-only imports from infrastructure (e.g. `RespuestaDeCierre` in `DayClose`, `Ocurrencia` in `CalendarApiService`) SHALL be permitted — zero runtime coupling.
- V11: `useRewardsStore` SHALL remain imported directly from `infrastructure/store` (documented exception: re-export would close the `Dependencies → useRewardsStore → Dependencies` cycle) until the future factory conversion. No other store MAY be imported directly.

### 3. Energy access and facade removal

- Energy history MUST be accessed ONLY through `useEnergyStore` from `di/Dependencies`; consumers MUST NOT import `EnergyHistoryService` functions.
- `EnergyHistoryService` MUST be deleted as the final step: only after all 4 consumers migrate (Home, Schedule, Settings, `useScheduleStore`) AND `pnpm tsc --noEmit` and `pnpm test` are green AND zero residual imports remain.
- `createScheduleStore` MUST receive `energyRepository: EnergyRepository` as a REQUIRED parameter; `EnergyRecord` MUST be imported from the port, not from the facade.

### 4. Store re-export policy

- `useAppStore`, `useFocusSessionStore`, `useAuthStore`, `useCalendarStore` and `useWizardDraftStore` MUST be re-exported from `di/Dependencies`; consumers MUST import them from there. `useRewardsStore` MUST remain a direct import (exception V11).

### 5. `fechaLocal` consolidation

- A single `fechaLocal(momento?: Date)` MUST live in `src/application/utils/dateTime.ts`; the local definitions in `RewardsApiService` and `CalendarApiService` MUST be removed; all consumers (stores, HomeView, StatsView, MonthGrid) MUST import the consolidated function. `Ocurrencia` SHALL stay type-only in `CalendarApiService`.

### 6. `AIChatView` warm-up

- `AIChatView` MUST replace the `warmUpBackend` call with `useBackendWarmUp()`; re-warming on foreground is an accepted behavior improvement.

### 7. R0 — Neutral Spanish UI copy

- All user-visible UI text introduced or modified by this change (labels, messages, dialogs, placeholders, accessibility) MUST be Neutral Spanish without voseo forms ("querés", "podés", "tenés", "hacé", "elegí", "contame", etc.).

## Scenarios

### Scenario 1: Presentation import audit (Happy Path)

- GIVEN the change is implemented
- WHEN an auditor greps `src/presentation/**` for `infrastructure` imports
- THEN zero matches are found except the sanctioned paths (V9 wrapper, V10 type-only, V11 `useRewardsStore`)

### Scenario 2: Energy flows through the store only

- GIVEN Home, Schedule and Settings need energy history
- WHEN they access it
- THEN each calls `useEnergyStore` from `di/Dependencies` and never imports `EnergyHistoryService`

### Scenario 3: Facade deletion gate

- GIVEN all 4 consumers migrated and `pnpm tsc --noEmit` + `pnpm test` pass
- WHEN `EnergyHistoryService` is deleted
- THEN a grep over the codebase reports zero residual imports of the facade

### Scenario 4: Store imports via DI

- GIVEN a consumer needs `useAppStore`, `useFocusSessionStore`, `useAuthStore`, `useCalendarStore` or `useWizardDraftStore`
- WHEN it imports
- THEN the import resolves to `di/Dependencies`
- AND `useRewardsStore` alone remains a direct import from `infrastructure/store`

### Scenario 5: Single `fechaLocal` source

- GIVEN the change is implemented
- WHEN `fechaLocal` is referenced
- THEN every consumer resolves to `application/utils/dateTime` and the API services no longer export it

### Scenario 6: `createScheduleStore` contract

- GIVEN a call to `createScheduleStore(...)` omitting `energyRepository`
- WHEN type-checked
- THEN `pnpm tsc --noEmit` fails (the parameter is required)

### Scenario 7: `AIChatView` foreground re-warm

- GIVEN `AIChatView` is mounted with `useBackendWarmUp()`
- WHEN the app returns to the foreground
- THEN the backend warm-up runs again (on top of the mount-time warm-up)

### Scenario 8: Neutral Spanish audit (R0)

- GIVEN the change is complete
- WHEN an auditor greps the new/modified presentation strings for voseo forms ("querés", "podés", "tenés", "hacé", "elegí", "contame")
- THEN zero matches are reported
