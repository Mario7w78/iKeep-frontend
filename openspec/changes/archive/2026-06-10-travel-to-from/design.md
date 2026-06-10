# Design: Split travelTime into travelTo / travelFrom

## Technical Approach

Replace single `travelTime: number` with independent `travelTo: number | null` and `travelFrom: number | null` across all layers. The backend solver uses `travel_to + duration + travel_from` as the total interval span and emits up to 3 blocks per activity (travel_to block, core block, travel_from block) using a new `VIAJE` activity type. Migration of existing AsyncStorage data maps old `travelTime` → `travelTo`, sets `travelFrom = 0`.

## Architecture Decisions

| # | Question | Choice | Alternatives | Rationale |
|---|----------|--------|--------------|-----------|
| 1 | VIAJE — new enum or reuse TRABAJO? | **New `VIAJE`** | Reuse TRABAJO | Client needs distinct rendering (gray, non-interactive); `tipo` drives UI, not semantics |
| 2 | Null vs 0 for unset travel | **`null` = not configured, `0` = explicitly none** | Always 0 | `null` lets UI show "not set" vs "0 min" — enables optional UX later |
| 3 | Solver interval enlargement for fixed tasks? | **Yes, same as flexible** | Only flexible | Proposal says both; fixed activities also need pre/post travel blocks |
| 4 | Travel blocks for `_add_fixed`: pre as start shift? | **Prepend/append intervals on the fixed block** | Separate optional interval vars | Fixed block times are known constants — simpler to emit surrounding travel as separate blocks post-solve |
| 5 | Migration: what to do with old `travelTime` | **`travelTo = stored value`, `travelFrom = 0`** | Split 50/50 | Old field was "solo ida" (one way) — mapping to `travelTo` preserves intent; `0` for return is safe |
| 6 | Backend Actividad: new fields in dataclass or separate? | **Add to Actividad dataclass** | Separate TravelConfig | Simpler, fewer files changed, travel is intrinsic to the activity |

## Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  TimePartitionForm │     │  CreateActivity   │     │  AsyncStorageRepo    │
│  (two chip rows)   │────▶│  UseCase          │────▶│  (migration)         │
│  travelTo/travelFrom│    │  (domain model)   │     │  old travelTime→     │
└──────────────────┘     └──────────────────┘     │  travelTo, travelFrom │
        │                                          └──────────┬───────────┘
        ▼                                                     ▼
┌──────────────────┐                                ┌──────────────────┐
│  ScheduleMapper   │                                │  API Request      │
│  (send to backend)│───────────────────────────────▶│  travel_to        │
│  travel_to        │                                │  travel_from      │
│  travel_from      │                                └────────┬─────────┘
└──────────────────┘                                         ▼
                                                     ┌──────────────────┐
                                                     │  Solver           │
                                                     │  interval =       │
                                                     │  travel_to + dur  │
                                                     │  + travel_from    │
                                                     └────────┬─────────┘
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Response         │
                                                     │  3 blocks:        │
                                                     │  VIAJE→CORE→VIAJE │
                                                     └──────────────────┘
```

## Sequence Diagram — Solver Flow

```
_build_travel_lookup()  ──→ lookup dict (existing, unchanged)
         │
         ▼
_add_fixed(model, act, state)
         │
         ├─ Create fixed interval [start, end]  (existing)
         │
         ▼
_add_flexible_task(model, act, ctx, state)
         │
         ├─ total_span = (act.travel_to or 0) + act.duracion_estimada + (act.travel_from or 0)
         ├─ s in [day_start, day_end - total_span]    ← enlarged window
         ├─ e = s + total_span
         └─ OptionalIntervalVar(s, total_span, e, p)  ← replaces dur-only interval
         │
         ▼
_build_response(solver, status, state)
         │
         ├─ For each flex task with assigned day:
         │   ├─ travel_to > 0  → emit VIAJE block [s, s + travel_to]
         │   ├─ emit core block [s + travel_to, s + travel_to + dur]
         │   └─ travel_from > 0 → emit VIAJE block [s + travel_to + dur, s + total_span]
         │
         ├─ For each fixed task:
         │   ├─ travel_to > 0  → emit VIAJE block at start
         │   └─ travel_from > 0 → emit VIAJE block at end
         │
         └─ _insert_travel_blocks() runs after (composes independently)
```

## File Changes

### TypeScript (Frontend)

| File | Action | Description |
|------|--------|-------------|
| `src/domain/entities/activity.types.ts` | Modify | `travelTime: number` → `travelTo: number \| null`, `travelFrom: number \| null` |
| `src/domain/entities/Activity.ts` | Modify | `getTotalTimeRequired()`: sum `travelTo + durationTime + travelFrom` |
| `src/presentation/hooks/useTimeForm.ts` | Modify | Split state: `travelToValue` + `travelFromValue`, dual setters |
| `src/presentation/components/molecules/CreateActivity/TimePartitionForm.tsx` | Modify | Two chip rows: "Viaje antes" / "Viaje después", both with quick-select chips |
| `src/presentation/components/molecules/CreateActivity/GroupTag.tsx` | Modify | Show both travel times per partition row |
| `src/presentation/components/organisms/Activity/ActivityConfigDetailModal.tsx` | Modify | Display both travel values |
| `src/presentation/components/organisms/CreateActivity/SummaryStep.tsx` | Modify | Aggregate both travel totals |
| `src/presentation/components/organisms/CreateActivity/TimeConfigStep.tsx` | Modify | Pass both travel values through |
| `src/presentation/screens/Activity/activityCreation/CreateActivityView.tsx` | Modify | Destructure `travelToValue`/`travelFromValue` |
| `src/infrastructure/repositories/AsyncStorageActivityRepository.ts` | Modify | Migration: read `travelTime` → `travelTo`, default `travelFrom: 0` |
| `src/presentation/components/organisms/Time/TimeSection.tsx` | Modify | Two steppers for travelTo/travelFrom |

### Python (Backend)

| File | Action | Description |
|------|--------|-------------|
| `domain/entities/activity.py` | Modify | Add `travel_to: int \| None = None`, `travel_from: int \| None = None` |
| `domain/entities/enums.py` | Modify | Add `VIAJE = "viaje"` to `TipoActividad` |
| `domain/entities/schedule_response.py` | No change | `BloqueTiempo` already generic — handles VIAJE |
| `schemas/activity.py` | Modify | Add `travel_to: int \| None = None`, `travel_from: int \| None = None`; add `VIAJE` to Pydantic `TipoActividad` |
| `schemas/schedule_response.py` | No change | `BloqueTiempo` generic, uses `TipoActividad` |
| `infrastructure/adapters/inbound/api/mappers.py` | Modify | Map `travel_to`/`travel_from` in `actividad_to_domain()` |
| `domain/services/schedule_service.py` | Modify | `_add_flexible_task`: enlarge interval by travel sum; `_build_response`: emit 3 blocks; `_add_fixed`: emit travel blocks post-solve |

## Interfaces / Contracts

### PartitionConfig (TypeScript — after)

```typescript
export type PartitionConfig = {
    startHour: Date;
    endHour: Date;
    durationTime: number;
    travelTo: number | null;
    travelFrom: number | null;
};
```

### Actividad (Python dataclass — after)

```python
@dataclass
class Actividad:
    id: str
    nombre: str
    tipo: TipoActividad
    # ... existing fields ...
    duracion_estimada: int = 0
    travel_to: int | None = None   # NEW
    travel_from: int | None = None # NEW
```

### Actividad (Pydantic schema — after)

```python
class Actividad(BaseModel):
    # ... existing fields ...
    travel_to: int | None = None
    travel_from: int | None = None
```

### TipoActividad (both enums — after)

```python
class TipoActividad(str, Enum):
    CLASE = "clase"
    TRABAJO = "trabajo"
    TAREA = "tarea"
    VIAJE = "viaje"  # NEW
```

### Solver — enlarged interval pseudocode

```python
# _add_flexible_task changes:
tt = act.travel_to or 0
tf = act.travel_from or 0
total_span = tt + act.duracion_estimada + tf

# Interval var uses total_span instead of dur:
s = model.NewIntVar(day_start, day_end - total_span, f"s_{act.id}_d{dia}")
e = model.NewIntVar(day_start + total_span, day_end, f"e_{act.id}_d{dia}")
iv = model.NewOptionalIntervalVar(dia * 1440 + s, total_span, dia * 1440 + e, p, f"iv_{act.id}_d{dia}")

# _build_response: emit up to 3 blocks per scheduled task
if tt > 0:
    blocks.append(BloqueTiempo(
        id_actividad=f"{tid}_viaje_to",
        nombre=f"Viaje a {info['nombre']}",
        tipo=TipoActividad.VIAJE, dia=dia,
        hora_inicio=s_val, hora_fin=s_val + tt))
blocks.append(BloqueTiempo(
    id_actividad=tid, nombre=info["nombre"],
    tipo=info["tipo"], dia=dia,
    hora_inicio=s_val + tt, hora_fin=s_val + tt + info["dur"]))
if tf > 0:
    blocks.append(BloqueTiempo(
        id_actividad=f"{tid}_viaje_from",
        nombre=f"Vuelta de {info['nombre']}",
        tipo=TipoActividad.VIAJE, dia=dia,
        hora_inicio=s_val + tt + info["dur"],
        hora_fin=s_val + tt + info["dur"] + tf))
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit (TS) | `PartitionConfig` type compiles | TypeScript compilation check |
| Unit (TS) | `getTotalTimeRequired()` with travelTo/travelFrom | Manual assertion in code review |
| Unit (Py) | Actividad dataclass with travel_to/travel_from | Unit instantiation test |
| Integration (Py) | `_add_flexible_task` enlarged interval | Verify solver accepts new field, produces correct span |
| Integration (Py) | Response with travel blocks | Run solver with travel_to=30, travel_from=15, assert 3 blocks per activity |
| Integration (Py) | Backward compat: travel_to=0, travel_from=0 | Same schedule output as old travelTime=0 |
| E2E (TS) | AsyncStorage migration | Load old activity with travelTime, assert travelTo=stored, travelFrom=0 |

## Migration / Rollout

**Deploy order**: Backend → Frontend

### Backend
1. Deploy new `Actividad` schema with optional `travel_to`/`travel_from`
2. Old requests without these fields default to `None` → solver treats as 0
3. No database migration needed (backend is stateless, data comes via API)

### Frontend
1. Update domain types first
2. Deploy AsyncStorage migration: on `getAll()`, if partition has `travelTime` (not `travelTo`), set `travelTo = travelTime, travelFrom = 0`
3. Since `travelTo`/`travelFrom` are `number | null` and `travelTime` was `number`, TypeScript catches every access site
4. Update UI components and hooks

### Rollback
1. Revert backend `activity.py`, `mappers.py`, `schedule_service.py`
2. Revert frontend types, hooks, UI components
3. AsyncStorage data is additive — old `travelTime` still readable

## Open Questions

- [ ] Should travel block rendering in schedule grid be handled now or in a follow-up? Proposal lists it in-scope but it affects the schedule renderer (not just the response DTO).
- [ ] `_insert_travel_blocks()` currently uses `TipoActividad.TRABAJO` — with `VIAJE` blocks from the solver, should `_insert_travel_blocks` also use `VIAJE`? (Yes, for consistency.)
