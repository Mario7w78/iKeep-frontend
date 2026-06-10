# Delta for Schedule Grid

## ADDED Requirements

### Requirement: VIAJE Block Rendering

The schedule grid and agenda view MUST render `VIAJE` blocks emitted by the solver. Each `VIAJE` block SHALL appear immediately before (for `travelTo`) or after (for `travelFrom`) its parent activity. `VIAJE` blocks MUST be visually distinct from regular activity blocks: non-interactive and rendered in a different color. Existing location-based `TiempoTraslado` travel blocks MUST continue to render independently.

#### Scenario: Pre-activity VIAJE block

- GIVEN the solver receives an activity with `travelTo=30` and `travelFrom=0`
- WHEN the solver response contains a `VIAJE` block of 30 minutes before the activity
- THEN the grid view MUST render a gray `VIAJE` block from `startTime - 30min` to `startTime`
- AND the block MUST NOT be draggable or tappable

#### Scenario: Post-activity VIAJE block

- GIVEN the solver receives an activity with `travelTo=0` and `travelFrom=15`
- WHEN the solver response contains a `VIAJE` block of 15 minutes after the activity
- THEN the grid view MUST render a gray `VIAJE` block from `endTime` to `endTime + 15min`

#### Scenario: Both pre and post VIAJE blocks

- GIVEN the solver receives an activity with `travelTo=30` and `travelFrom=30`
- WHEN the solver response contains two `VIAJE` blocks
- THEN the grid MUST render a pre-activity VIAJE block AND a post-activity VIAJE block

#### Scenario: No travel produces no VIAJE blocks

- GIVEN all activities have `travelTo=null` and `travelFrom=null`
- WHEN the solver returns the schedule
- THEN no `VIAJE` blocks SHALL appear in the response

#### Scenario: VIAJE coexists with location-based travel

- GIVEN a schedule has both a `VIAJE` block (from travelTo) and a `TiempoTraslado` block (from location constraints)
- WHEN rendered in grid view
- THEN both block types MUST appear independently at their own positions
- AND `VIAJE` SHALL use a different color from location-based travel blocks
