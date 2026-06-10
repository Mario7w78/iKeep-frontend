# Proposal: Split travelTime into travelTo / travelFrom

## Intent

Split the single frontend-only `travelTime` field into `travelTo: number | null` and `travelFrom: number | null` so the backend scheduler can account for pre- and post-activity travel blocks independently, and emit them as visible schedule blocks.

## Scope

### In Scope
- Domain model: `travelTime` → `travelTo | travelFrom` in TypeScript + Python dataclasses
- Backend solver: enlarge interval to `travel_to + duration + travel_from`, emit split blocks in response
- Backend API: add `travel_to`, `travel_from` to Pydantic schema + mappers
- Frontend UI: two chip selectors in TimePartitionForm, display both in ActivityConfigDetailModal and GroupTag
- AsyncStorage migration: read old `travelTime` → map to `travelTo`, null `travelFrom`
- New `VIAJE` TipoActividad for travel blocks in solver output

### Out of Scope
- Location-to-location travel constraints (`TiempoTraslado`) — compose independently, no changes
- Named travel profiles ("walk", "drive") — future work
- Per-day travel overrides — travel is per-activity, same for all days

## Capabilities

### New Capabilities
None — no new spec files needed.

### Modified Capabilities
- `activity_creation`: travel time config changes from one chip selector (`travelTime`) to two (`travelTo`, `travelFrom`). Relevant scenarios need updates.
- `schedule_grid`: schedule now includes `VIAJE` blocks emitted by the solver. Grid and agenda views must render them.

## Approach

### Domain & API (TypeScript + Python)
- `PartitionConfig.travelTime: number` → `travelTo: number | null`, `travelFrom: number | null`
- `getTotalTimeRequired()`: sum of `travelTo + duration + travelFrom`
- Migration: old AsyncStorage entries with `travelTime` → `travelTo: storedValue, travelFrom: 0`
- Python dataclass + Pydantic: `travel_to: int | None`, `travel_from: int | None`

### Backend Solver
- Interval vars use `travel_to + duracion_estimada + travel_from` as total span
- On solve: emit 0–3 blocks per activity (travel_to, core, travel_from) with `tipo: VIAJE`
- `VIAJE` = new value in `TipoActividad` enum, rendered as gray travel block

### UI
- TimePartitionForm: two chip rows labeled "Viaje antes" / "Viaje después"
- SummaryStep / GroupTag: show both values
- Schedule renderer: render `VIAJE` blocks as non-interactive, colored differently

## Decisions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | `VIAJE` new or reuse `TRABAJO`? | **New `VIAJE`** | Cleaner semantic, distinct rendering |
| 2 | Travel blocks for fixed activities? | **Yes, both** | Fixed activities also need pre/post travel |
| 3 | `travelFrom` default for old data? | **0** | Backward compat — migration sets 0, null means "not configured" |
| 4 | UI layout: two rows or combined? | **Two rows** | Pre/post separation is clearer to the user |

## Boundaries
- No changes to location-based `TiempoTraslado` constraints
- No per-day travel granularity
- No drag-to-reorder on `VIAJE` blocks
- Solver still treats travel blocks as non-skippable (always emitted when travel > 0)

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Old AsyncStorage data without `travelTo/travelFrom` | Med | Migration reads old `travelTime` field; if absent, defaults to 0 |
| Solver breaks for existing schedules | Low | `travel_to=0, travel_from=0` produces same behavior as current `travelTime=0` |
| UI overflow with 3 blocks per activity | Low | Grid view already handles multi-block activities; VIAJE blocks are narrower |

## Rollback Plan

1. Revert backend: restore `activity.py`, `mappers.py`, `schedule_service.py` to previous commit
2. Revert frontend: restore `travelTime` in domain model, forms, and display components
3. AsyncStorage: old data is still readable if migration is additive; no data loss
4. Deploy backend first, then frontend — if backend fails, frontend still sends no travel data (same as now)

## Dependencies
- Backend must deploy BEFORE frontend (API fields must exist before frontend sends them)

## Success Criteria
- [ ] `travelTo` and `travelFrom` stored, displayed, and sent independently in API
- [ ] Backend solver emits `VIAJE` blocks at correct positions in schedule response
- [ ] Old `travelTime` data migrates without data loss
- [ ] Existing schedules with `travelTime=0` produce identical schedule output
