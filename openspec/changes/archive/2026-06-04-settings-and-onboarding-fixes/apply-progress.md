# Apply Progress: settings-and-onboarding-fixes

**Current Workload**: PR 3: Phase 4 & 5 (Schedule Grid, swipe gesture modal & verification)
**Mode**: Standard
**Status**: 30/30 tasks complete. Typechecking successful.

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

### Phase 3: Stepped Activity Wizard Refactoring
- **NameIdentityStep (Step 1)**: Created the component containing the Activity Name text input and Identity selection cards (Clase, Trabajo, Tarea). Included lowered placeholderTextColor opacity (0.4) and a dynamic icon next to/inside the input that updates based on keyword detection (`uni`/`clase`/`estudiar` -> `school-outline`, `trabajo`/`reunion` -> `briefcase-outline`, default -> `document-text-outline`). Implemented auto-toggles on identity press (Clase sets fixed to true, Tarea sets fixed to false/optimizable).
- **TypeDifficultyStep (Step 2)**: Created the component containing the Type selection (Fixed vs Optimizable) and Difficulty selection (Baja, Normal, Alta). Capitalized the difficulty selection header as "Dificultad de la actividad".
- **PriorityDeadlineStep (Step 3)**: Locked selection and disabled/faded out priority cards to "alta" when `isFixed` is true.
- **DaySelectionStep (Step 4)**: Shifted to Step 4 of the wizard.
- **TimeConfigStep (Step 5)**: Shifted to Step 5 of the wizard. Removed the day badge (`dayBadge`) element representing the day's first letter from the header card. Passed `endTime` and `onSetEndTime` to `TimePartitionForm`.
- **TimePartitionForm**: Updated the component to render an End Hour timepicker ("Hora de fin") instead of duration fields when `isFixed` is true, and hide duration chips and inputs. Render only the Duration text inputs when `isFixed` is false. Removed the quick duration chips (30, 60, 90, 120 mins).
- **useTimeForm hook**: Updated to calculate duration in minutes as `endHour - startHour` for fixed activities. Automatically locks priority to "alta" when `isFixed` is set to true. Exposes `setEndTime`. Localized validation alert messages to Neutral Spanish ("Guardá" -> "Guarda").
- **CreateActivityView**: Refactored the screen to run a linear 6-step progress state (Name & Identity -> Type & Difficulty -> Priority & Deadline -> Day Selection -> Hour Configuration -> Summary). Localized wizard step errors/alerts to Neutral Spanish ("Seleccioná" -> "Selecciona", "Configurá" -> "Configura"). Added a full-screen loader overlay spinner with `ActivityIndicator` during the async save operation.

### Phase 4: UI Adjustments & Schedule Grid
- **ScheduleHeader**: Added a view toggle button (agenda/list view vs grid view) next to the refresh button. Exposes props `viewMode: 'grid' | 'list'` and `onToggleViewMode: () => void`. Renders conditional icon ('list-outline' or 'calendar-outline') to represent view toggles.
- **ScheduleView**:
  - Implemented state `viewMode: 'grid' | 'list'` defaulting to `'grid'`.
  - Added horizontal scroll pager page switching logic: displays either standard 24-hour `ScheduleGrid` or custom vertical `ChronologicalAgendaList` page for each day depending on view mode state.
  - Implemented `ChronologicalAgendaList` with complete details display: title, identity icon, time range range, priority badge/color, difficulty badge/color.
  - Created a friendly empty-state layout inside `ChronologicalAgendaList` when a day contains zero activities in list view.
  - Enforced height boundaries on vertical scrolls to guarantee smooth scrolling without overlapping or layout breaks.
- **ActivityDetailModal**:
  - Cleaned up grid item borders, backgrounds, and paddings to yield a borderless look that matches `ActivityConfigDetailModal.tsx`.
  - Implemented vertical swipe-down dismissal using `PanResponder` and `Animated.translateY` with slide-out-to-dismiss threshold and spring-back cancellation.
  - Reorganized overlay JSX layout to adopt sibling backdrop press layout, avoiding touch-bubbling interference.

## Verification
- Ran TypeScript compilation checks using `npx tsc --noEmit` and verified 100% clean compilation.
