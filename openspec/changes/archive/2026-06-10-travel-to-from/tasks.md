# Tasks: Split travelTime into travelTo / travelFrom

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes (optional — backend ~120 lines standalone) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main (completed) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main (completed)
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: domain enums, dataclass, Pydantic, solver, mappers | PR 1 → main | ~120 lines, self-contained, deploy first |
| 2 | Frontend: types, hooks, DTOs, UI components, migration, grid | PR 2 → main | ~200–330 lines, depends on backend API being live |

## Phase 1: Domain & Data Model

- [x] 1.1 `activity.types.ts` — `travelTime: number` → `travelTo: number | null`, `travelFrom: number | null` (~5 lines)
- [x] 1.2 `Activity.ts` — `getTotalTimeRequired()` sum `travelTo + duration + travelFrom` (~5 lines)
- [x] 1.3 `enums.py` — add `VIAJE = "viaje"` to `TipoActividad` (~3 lines)
- [x] 1.4 `activity.py` (domain) — add `travel_to: int | None`, `travel_from: int | None` to dataclass (~5 lines)
- [x] 1.5 `schemas/activity.py` — add `travel_to`, `travel_from` to Pydantic model + non-negative validation (~10 lines)

## Phase 2: Backend Solver

- [x] 2.1 `schedule_service.py` — `_add_flexible_task`: enlarge interval to `tt + dur + tf` (~15 lines)
- [x] 2.2 `schedule_service.py` — `_build_response`: emit up to 3 blocks per activity (VIAJE, core, VIAJE) (~25 lines)
- [x] 2.3 `schedule_service.py` — `_add_fixed`: emit travel blocks for fixed activities post-solve (~10 lines)
- [x] 2.4 `schedule_service.py` — `_insert_travel_blocks`: use `TipoActividad.VIAJE` for consistency (~3 lines)
- [x] 2.5 `mappers.py` — map `travel_to`/`travel_from` in `actividad_to_domain()` (~5 lines)

## Phase 3: Frontend State & API

- [x] 3.1 `useTimeForm.ts` — `travelTimeValue` → `travelToValue` + `travelFromValue` with dual setters (~20 lines)
- [x] 3.2 `ActivityDto.ts` — add `travelTo`/`travelFrom` to ActividadFijaDto and TareaPendienteDto (~5 lines)
- [x] 3.3 `scheduleMapper.ts` — send `travel_to`/`travel_from` in API request body (~5 lines)

## Phase 4: Frontend UI

- [x] 4.1 `TimePartitionForm.tsx` — two chip rows labeled "Viaje antes" / "Viaje después" (~30 lines)
- [x] 4.2 `GroupTag.tsx` — display both `travelTo` and `travelFrom` per partition (~10 lines)
- [x] 4.3 `ActivityConfigDetailModal.tsx` — display both travel values (~10 lines)
- [x] 4.4 `SummaryStep.tsx` — aggregate `travelTo` + `travelFrom` totals (~10 lines)
- [x] 4.5 `TimeConfigStep.tsx` — pass both `travelToValue`/`travelFromValue` (~5 lines)
- [x] 4.6 `CreateActivityView.tsx` — destructure and pass both values (~5 lines)
- [x] 4.7 `TimeSection.tsx` — two steppers for `travelTo`/`travelFrom` (~20 lines)

## Phase 5: Persistence & Migration

- [x] 5.1 `AsyncStorageActivityRepository.ts` — on `getAll()`, detect legacy `travelTime` → set `travelTo = stored`, `travelFrom = 0` (~15 lines)

## Phase 6: Schedule Grid Rendering

- [x] 6.1 `ActivityBlock.tsx` — render `VIAJE` blocks as gray (`VIAJE_COLOR`), non-interactive (`View` instead of `TouchableOpacity`), distinct from location-based travel blocks (~30 lines)
