# Exploration: settings-and-onboarding-fixes

### Current State
The application is structured using Hexagonal/Clean Architecture, divided into domains, application ports/use-cases, infrastructure storage, and a React Native presentation layer.
- **Onboarding**: Configured via a series of slides in `OnboardingVIew.tsx` that collect the user's start/end day times and write them to `OnboardingDayLimitPersistence.ts`.
- **Activity Creation**: A wizard-based system managed in `CreateActivityView.tsx` with five steps (`NameTypeStep`, `PriorityDeadlineStep`, `DaySelectionStep`, `TimeConfigStep`, `SummaryStep`). It currently groups name, type (fixed/optimizable), difficulty, and identity in a single screen, uses Argentine Spanish, and expects duration inputs for both fixed and optimizable activities.
- **Schedule**: Displayed in `ScheduleView.tsx` through a 24-hour grid scroll view (`ScheduleGrid.tsx`) with a hardcoded start/end hour range.
- **Settings**: A basic input screen (`SettingsView.tsx`) to edit active day limits, always editable and always displaying the save button.

---

### Affected Areas
- **`src/presentation/components/organisms/Onboarding/OnboardingVIew.tsx`**
  - Add username input slide.
  - Implement "Seleccionar la hora" button placeholder.
  - Update Slide 4 & 5 descriptions and titles to neutral Spanish.
  - Fix madrugada range validation checking `startMin === endMin` instead of `startMin >= endMin`.
- **`src/presentation/screens/Home/HomeView.tsx`**
  - Make greeting dynamic using username from store instead of hardcoded "Mario".
  - Change "querés" to neutral "quieres".
- **`src/presentation/screens/Settings/SettingsView.tsx`**
  - Fix validation condition for midnight crossover to reject only `startMin === endMin`.
  - Add an edit mode toggle (`isEditing`). Hide "Guardar" button and disable pickers by default until "Editar" is pressed.
  - Change "querés" to neutral "quieres" and "definí" to "define".
- **`src/infrastructure/store/useAppStore.ts`**
  - Add `username` and `setUsername` states for persistence.
- **`src/infrastructure/store/useScheduleStore.ts`**
  - Fix validation range reset condition from `>=` to `===` when loading bounds.
- **`src/presentation/components/organisms/CreateActivity/NameTypeStep.tsx`**
  - Rename difficulty header to "dificultad de la actividad".
  - Set `isFixed` to `false` (Optimizable) by default when `identity === "tarea"`.
  - Add dynamic icon next to name input based on selected identity.
  - Lower the placeholder text opacity of the name input to `0.4`.
- **`src/presentation/components/organisms/CreateActivity/PriorityDeadlineStep.tsx`**
  - Block priority selection (set to `alta` and disabled) when `isFixed` is `true`.
- **`src/presentation/components/organisms/CreateActivity/TimeConfigStep.tsx`**
  - Remove `dayBadge` element from the header card.
- **`src/presentation/components/molecules/CreateActivity/TimePartitionForm.tsx`**
  - Remove frequent duration chips (e.g., `30`, `60`, `90`, `120`).
  - Render an "Hora de fin" picker instead of duration fields when `isFixed` is `true`, computing duration under the hood.
- **`src/presentation/screens/Activity/activityCreation/CreateActivityView.tsx`**
  - Add dynamic step division to split Step 1 into Name/Identity and Type/Difficulty.
  - Add dynamic loading overlay screen during `handleSaveActivity` execution.
  - Bind `PanResponder` to the header of the bottom sheet to enable natural swipe gestures.
- **`src/presentation/screens/Schedule/ScheduleView.tsx`**
  - Implement a toggle to switch between chronological agenda list (no gaps) and 24-hour hour grid.
- **`src/presentation/components/organisms/Activity/ActivityConfigDetailModal.tsx` & `src/presentation/components/organisms/Schedule/ActivityDetailModal.tsx`**
  - Clean up static, visual indicator lines or dividers that are unused.
- **Argentinian Conjugations in other files**
  - `DaySelectionStep.tsx` (change "Seleccioná" to "Selecciona")
  - `CreateActivityView.tsx` (change "Seleccioná" to "Selecciona", "Configurá" to "Configura")
  - `useTimeForm.ts` (change "Guardá" to "Guarda")

---

### Approaches
1. **Direct inline state and layout refactoring**
   - **Pros**: Maintains local state structure in `CreateActivityView` and hooks. Low regression impact.
   - **Cons**: Code in `CreateActivityView` is already long; adding more screens and validation states increases file length.
   - **Effort**: Medium

2. **Decoupled step components and custom hook delegation**
   - **Pros**: Splits step components into modular sub-sections, delegating logic cleanly. Extends `useTimeForm` to handle end time conversion logic cleanly.
   - **Cons**: Minor effort to align types across steps.
   - **Effort**: Low to Medium

---

### Recommendation
Adopt **Approach 2**. Splitting the concentrated step 1 screen and delegating the end time conversion (calculating duration as `endTime - startTime`) to `useTimeForm` keeps the components dumb and reusable.

---

### Risks
- Modifying the validation logic for day limits to support dawn hours (start hour > end hour) could cause unexpected behavior in backend schedules if the backend active hours constraint solver is not prepared. *Mitigation:* Ensure active hour minutes are sent raw to the API, which matches standard request payloads.

### Ready for Proposal
Yes
