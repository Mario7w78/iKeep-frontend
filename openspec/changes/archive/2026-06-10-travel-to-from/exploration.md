# Exploration: split travelTime into travelTo / travelFrom

## Current State

### Frontend
- `PartitionConfig.travelTime: number` — single travel time value (default 0), frontend-only
- Displayed in UI, stored in AsyncStorage, NEVER sent to backend
- Used in `TimePartitionForm` (chip selector: 0/15/30/45/60 + custom picker)
- Labeled "solo ida" (one way only)

### Backend
- No per-activity travel time concept
- Only location-to-location travel (`TiempoTraslado`) between activity locations
- Solver (`schedule_service.py`) uses `_add_travel_constraints()` to enforce gaps between activities at different locations
- Post-solve, `_insert_travel_blocks()` inserts visible `viaje_X_Y` blocks

## Change Points

### Frontend (11 files, ~104 lines)
1. `activity.types.ts` — `travelTime` → `travelTo: number | null` + `travelFrom: number | null`
2. `Activity.ts` — update `getTotalTimeRequired()`
3. `useTimeForm.ts` — two state values instead of one
4. `TimePartitionForm.tsx` — two chip selectors (pre/post)
5. `GroupTag.tsx` — display both travel times
6. `ActivityConfigDetailModal.tsx` — display both travel times
7. `SummaryStep.tsx` — aggregate both travel times
8. `TimeConfigStep.tsx` — pass both values
9. `CreateActivityView.tsx` — update destructuring and props
10. `scheduleMapper.ts` — send both to backend
11. `ActivityDto.ts` — add new fields

### Backend (4 files, ~50 lines)
1. `domain/entities/activity.py` — add `travel_to`, `travel_from`
2. `schemas/activity.py` — add to Pydantic model
3. `mappers.py` — map new fields
4. `schedule_service.py` — enlarge intervals, split response blocks

### Solver Approach
- Enlarge interval: `total_dur = (travel_to or 0) + duracion_estimada + (travel_from or 0)`
- Response: emit 3 blocks per activity (travel_to, core, travel_from)
- Existing location-based travel constraints compose independently

### Estimated total: ~154 lines + migration
