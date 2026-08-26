# Specification: Schedule Grid

## Intent
Improve grid usability and scroll stability, provide a chronological list view of activities without time gaps, and dynamically greet the user based on their saved username in Neutral Spanish.

## Requirements

### 1. Chronological Agenda List View
- The Schedule screen MUST display a toggle control (e.g. icon button) to switch the display mode between:
  - **Grid View**: A 24-hour time block grid showing activities at their exact times with vertical spacing and gaps representing free time.
  - **Chronological/Agenda View**: A sequential list of activities ordered by start time, without vertical space gaps or hour rows representing empty periods.
- In Chronological View, if no activities are scheduled for the selected day, a friendly empty-state layout MUST be shown.
- The Chronological list items MUST render clearly, detailing name, time range, priority, and difficulty.

### 2. Scroll and Height Constraints
- The calendar Grid View scroll container MUST behave correctly under vertical scrolling, ensuring no overlapping cards or layout breaks.
- Flexbox layouts and height bounds MUST be set properly so the scroll view fits nicely inside all mobile screens.

### 3. Dynamic User Greeting and Localization
- On the Home screen (`HomeView.tsx`), the greeting text MUST dynamically display the user's username retrieved from the global app state (e.g., "Hola, {username}. Tu día está listo.") instead of the hardcoded name "Mario".
- The confirmation dialogs and prompt copy on the Home screen MUST use Neutral Spanish.
- Specifically, the following Argentinian conjugation MUST be replaced:
  - "querés" -> "quieres" (e.g. "Estás seguro de que quieres actualizar tu horario...")

---

### 4. VIAJE Block Rendering
- The schedule grid and agenda view MUST render `VIAJE` blocks emitted by the solver.
- Each `VIAJE` block SHALL appear immediately before (for `travelTo`) or after (for `travelFrom`) its parent activity.
- `VIAJE` blocks MUST be visually distinct from regular activity blocks: non-interactive and rendered in a different color.
- Existing location-based `TiempoTraslado` travel blocks MUST continue to render independently.

---

### 5. Create One-Off Activity from Selected Day

- The month view day-detail panel MUST provide a "+" action that opens the activity creation wizard with the selected day's date pre-filled as a one-off (`fecha_unica`) activity. The created activity SHALL apply only to that date ("Solo este día" semantics).

### 6. Move Occurrence to Another Date

- The day-detail panel MUST offer a move action per occurrence row. Moving SHALL persist a `movida` exception via `PUT /api/v1/calendario/excepciones` with the picked target date.

### 7. Cancel and Restore Occurrence

- The day-detail panel MUST offer a cancel action per occurrence row, persisting a `cancelada` exception. Cancelled occurrences of activities that still exist MUST offer a restore action that deletes the exception.

### 8. Month View Reflects Mutations Immediately

- After any successful create, move, or cancel/restore from the day-detail panel, the system MUST reload the visible month so the grid reflects the change without manual refresh.

### 9. Local Date Strings Only

- All dates in create/move/cancel flows MUST travel as local `YYYY-MM-DD` strings. The system MUST NOT convert them through UTC or timezone-shifting operations.

> **Non-goal (documented limitation):** One-off (`fecha_unica`) events appear ONLY in month view; the solver-generated weekly grid and daily schedule do NOT display them. This is out of scope here and deferred to future change `unica-en-horario-semanal`. UX copy must make this explicit.

---

## Scenarios

### Scenario 1: Toggling between Grid and Chronological view (Happy Path)
- **Given** the user is viewing their generated schedule on the Schedule tab
- **When** the user taps the view mode toggle button
- **Then** the view MUST switch from the 24-hour Grid View to the Chronological Agenda List View
- **And** the list MUST display the scheduled activities sequentially (e.g. 10:00 to 11:30 Class, immediately followed by 12:00 to 13:00 Work) with no empty space gaps between them
- **When** the user taps the toggle button again
- **Then** the view MUST switch back to the 24-hour Grid View showing the 10:00-11:30 and 12:00-13:00 blocks separated by an empty space representing the free hour (11:30 to 12:00)

### Scenario 2: Chronological View Empty State (Edge Case)
- **Given** the user is viewing the Chronological Agenda List View on a day with no activities scheduled (e.g., "Domingo")
- **When** that day is selected
- **Then** the list MUST show an empty state indicating that there are no activities scheduled for that day, instead of showing a blank screen or crashing

### Scenario 4: Pre-activity VIAJE block
- **Given** the solver receives an activity with `travelTo=30` and `travelFrom=0`
- **When** the solver response contains a `VIAJE` block of 30 minutes before the activity
- **Then** the grid view MUST render a gray `VIAJE` block from `startTime - 30min` to `startTime`
- **And** the block MUST NOT be draggable or tappable

### Scenario 5: Post-activity VIAJE block
- **Given** the solver receives an activity with `travelTo=0` and `travelFrom=15`
- **When** the solver response contains a `VIAJE` block of 15 minutes after the activity
- **Then** the grid view MUST render a gray `VIAJE` block from `endTime` to `endTime + 15min`

### Scenario 6: Both pre and post VIAJE blocks
- **Given** the solver receives an activity with `travelTo=30` and `travelFrom=30`
- **When** the solver response contains two `VIAJE` blocks
- **Then** the grid MUST render a pre-activity VIAJE block AND a post-activity VIAJE block

### Scenario 7: No travel produces no VIAJE blocks
- **Given** all activities have `travelTo=null` and `travelFrom=null`
- **When** the solver returns the schedule
- **Then** no `VIAJE` blocks SHALL appear in the response

### Scenario 8: VIAJE coexists with location-based travel
- **Given** a schedule has both a `VIAJE` block (from travelTo) and a `TiempoTraslado` block (from location constraints)
- **When** rendered in grid view
- **Then** both block types MUST appear independently at their own positions
- **And** `VIAJE` SHALL use a different color from location-based travel blocks

### Scenario 3: Dynamic User Greeting on Home screen (Happy Path)
- **Given** the user completed onboarding with username "Lucía"
- **When** the user navigates to the Home screen
- **Then** the top greeting header MUST display: "Hola, Lucía. Tu día está listo."

### Scenario 9: Plus button opens wizard with date preset
- **Given** the user is in month view and has selected day `2026-09-10`
- **When** the user taps "+" in the day-detail panel
- **Then** the creation wizard MUST open with `2026-09-10` pre-filled as the activity date
- **And** the wizard MUST indicate "Solo este día" instead of Step 4 day selection

### Scenario 10: Created one-off persists and appears on its date
- **Given** the user completed the wizard from day `2026-09-10`
- **When** the save request succeeds
- **Then** the activity MUST be persisted with `fecha_unica = 2026-09-10`
- **And** after month reload, day `2026-09-10` MUST list the new occurrence

### Scenario 11: Move occurrence from day-detail panel
- **Given** day `2026-09-10` shows an occurrence of activity "Examen"
- **When** the user taps "Mover", picks target date `2026-09-12`, and confirms
- **Then** a `movida` exception MUST be saved for (`activity_id`, `2026-09-10`) with `nueva_fecha = 2026-09-12`
- **And** after reload, `2026-09-10` no longer lists it and `2026-09-12` shows it flagged `movida_desde = 2026-09-10`

### Scenario 12: Cancel occurrence
- **Given** day `2026-09-10` shows an occurrence
- **When** the user taps "Cancelar" and confirms
- **Then** a `cancelada` exception MUST be saved and the occurrence MUST disappear from day `2026-09-10` after reload

### Scenario 13: Restore cancelled occurrence
- **Given** an occurrence on `2026-09-10` was cancelled
- **When** the user taps "Restaurar" on that row
- **Then** the exception MUST be deleted via `DELETE /api/v1/calendario/excepciones`
- **And** the occurrence MUST reappear in day `2026-09-10` after reload

### Scenario 14: Grid updates without manual refresh
- **Given** the user performs any create/move/cancel/restore action from the panel
- **When** the mutation succeeds
- **Then** the month data MUST be reloaded automatically
- **And** the grid dots and day-detail list MUST reflect the new state

### Scenario 15: No timezone drift
- **Given** the user selects `2026-09-10` in any picker
- **When** the value reaches the API payload
- **Then** it MUST arrive exactly as `"2026-09-10"`
