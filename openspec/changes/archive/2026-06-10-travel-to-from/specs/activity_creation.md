# Delta for Activity Creation

## ADDED Requirements

### Requirement: Travel Time Configuration

The activity creation flow MUST provide two separate travel time chip selectors in the time configuration step: `travelTo` (minutes before the activity) and `travelFrom` (minutes after the activity). Each selector MUST offer chip options: 0, 15, 30, 45, 60 minutes. The user MAY leave both selectors untouched (null).

For backward compatibility, when loading an activity with the legacy `travelTime` field and no `travelTo`/`travelFrom`, the system MUST set `travelTo` to the stored value and `travelFrom` to 0.

#### Scenario: Setting travel time before an activity

- GIVEN the user is on Step 5 (Time Configuration)
- WHEN the user taps "15" in the "Viaje antes" chip row
- THEN `travelTo` MUST be set to 15
- AND the chip "15" MUST appear visually selected in that row

#### Scenario: Setting travel time after an activity

- GIVEN the user is on Step 5 (Time Configuration)
- WHEN the user taps "30" in the "Viaje después" chip row
- THEN `travelFrom` MUST be set to 30
- AND the chip "30" MUST appear visually selected in that row

#### Scenario: Both travel times left as null

- GIVEN the user is on Step 5 (Time Configuration)
- WHEN the user does not interact with either travel chip row
- THEN both `travelTo` and `travelFrom` MUST be null
- AND the total activity time SHALL use only the activity's duration

#### Scenario: Legacy travelTime migration

- GIVEN a stored activity has `travelTime: 45` and no `travelTo` or `travelFrom` field
- WHEN the activity is loaded from AsyncStorage
- THEN the system MUST set `travelTo` to 45 and `travelFrom` to 0
