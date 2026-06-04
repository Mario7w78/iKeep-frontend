# Proposal: Settings and Onboarding Fixes

## Intent
Improve UX and stability by fixing onboarding slide/input issues, settings row toggle and time boundary (madrugada) bugs, activity creation flows, and grid scroll heights.

## Scope
### In Scope
- **Onboarding**: Slide alignment adjustments, translation to Neutral Spanish, fixing selections and name input.
- **Settings**: Fixing row toggle behavior and resolving the madrugada (early morning) time boundary bug.
- **Activity Creation**: Splitting flow into steps with icons, replacing the duration picker with a fixed-time endHour picker, and defaulting activity state to optimizable.
- **Grid Layout**: Improving calendar grid scroll and height constraints.

### Out of Scope
- Rewriting the core calendar rendering engine.
- Redesigning the global theme or color palette.

## Capabilities
### New Capabilities
- Stepped wizard flow for activity creation with step icons.
- Absolute `endHour` picker during activity creation.

### Modified Capabilities
- Onboarding screen inputs and slide navigations in Neutral Spanish.
- Robust Settings toggles and madrugada boundary handling.
- Scrollable layout for grid views.

## Approach
1. **Onboarding**: Align slide components, localize texts, and hook name input to local state.
2. **Settings**: Fix toggle state callback and wrap hour-boundary arithmetic to handle 00:00 - 06:00 limits.
3. **Activity Creation**: Split form into multiple steps, change duration field to `endHour` select, and set default optimizable state.
4. **Grid**: Use flexbox/height parameters to allow proper scrolling.

## Affected Areas
- Onboarding screens and slide components
- Settings screen and boundary logic
- Activity creation form/wizard components
- Calendar/grid components

## Risks & Mitigations
| Risk | Mitigation |
| :--- | :--- |
| Hour boundary edge cases | Add unit tests specifically covering late night / early morning hours |
| UI wizard state loss | Maintain step states in screen container state |

## Rollback Plan
- Revert changes using standard git rollback: `git checkout main -- <files>` or revert commit.

## Dependencies
- None.

## Success Criteria
- Onboarding slide and input state work in Neutral Spanish.
- Settings toggles work and madrugada bug does not freeze/crash/corrupt time settings.
- Activity creation uses step-wizard with icons and fixed-time endHour picker.
- Calendar grid scroll is smooth and does not overlap.
