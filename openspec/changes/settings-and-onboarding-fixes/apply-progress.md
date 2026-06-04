# Apply Progress: settings-and-onboarding-fixes

**Current Workload**: PR 1: Phase 1 & 2 (Foundation, Onboarding & Settings)
**Mode**: Standard
**Status**: 5/30 tasks complete. Typechecking successful.

## Work Completed

### Phase 1: Foundation
- **useAppStore**: Added `username: string` and `setUsername: (name: string) => void` to persistent onboarding state.
- **useScheduleStore**: Modified `loadDayLimits` to trigger boundary resets on load *only* when start and end times are exactly equal (`sH === eH`), allowing correct crossover/late-night boundaries.

### Phase 2: Onboarding & Settings Refactoring
- **OnboardingView**:
  - Integrated username input slide (slide index 0) with person-outline icon.
  - Bound name input to `useAppStore`'s `username` and `setUsername`.
  - Configured placeholder text for the username input with exactly `0.4` opacity (`rgba(255, 255, 255, 0.4)`).
  - Blocked progression/swiping past username slide if name is empty or contains only whitespace.
  - Implemented selection placeholder text displaying "Seleccionar la hora" for sunrise and sunset pickers prior to time selection.
  - Localized all onboarding slides to Neutral Spanish (replaced Argentinian conjugations like "Creá", "gestioná", "Visualizá", "dejá", "revisá").
  - Changed limit validation logic during onboarding to use strictly `===` checks (allowing crossover hours).
- **HomeView**:
  - Connected `useAppStore.username` to display the personalized greeting ("Hola, {username}").
  - Localized energy status update confirmation alert text to Neutral Spanish ("querés" -> "quieres").
- **SettingsView**:
  - Implemented read-only mode by default, disabling time pickers and hiding "Guardar"/"Cancelar" buttons.
  - Added an "Editar" button to toggle into edit mode, enabling inputs and exposing "Guardar" / "Cancelar" actions.
  - Added resetting local changes to active saved values upon clicking "Cancelar".
  - Configured confirm alerts when saving limits using Neutral Spanish ("quieres").
  - Updated settings validation checks to reject only equal times (`startMin === endMin`), allowing crossover late-night hours.

## Verification
- Ran TypeScript checks with `pnpm tsc --noEmit` which completed successfully with no errors.
