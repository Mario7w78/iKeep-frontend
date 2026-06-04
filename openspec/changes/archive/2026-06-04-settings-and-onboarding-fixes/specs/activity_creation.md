# Specification: Activity Creation

## Intent
Improve the usability, clarity, and UX of the activity creation flow by splitting steps, adding dynamic icons, enforcing priority locks on fixed activities, and using an end hour picker instead of duration fields for fixed activities.

## Requirements

### 1. Stepped Wizard Split
- The activity creation flow MUST be a stepped wizard with clear indicators and step icons.
- Step 1 from the original flow MUST be split into two separate steps:
  - **Step 1 (Name and Identity)**: Includes the Activity Name input field and the Identity selection (Clase, Trabajo, Tarea).
    - The Activity Name input placeholder MUST have an opacity of `0.4`.
    - A dynamic icon MUST be rendered next to the name input, matching the selected identity (e.g. school icon for Clase, briefcase icon for Trabajo, checkmark icon for Tarea).
  - **Step 2 (Type and Difficulty)**: Includes the Activity Type selection (Fixed or Optimizable) and the Difficulty selection (Baja, Normal, Alta).
    - The default activity state MUST be Optimizable (`isFixed` = `false`) when the identity is `"tarea"`.
    - The difficulty selection header MUST be labeled "dificultad de la actividad".
- The remaining steps MUST shift accordingly:
  - **Step 3**: Priority and Deadline selection.
  - **Step 4**: Day selection.
  - **Step 5**: Time config per day (TimeConfigStep).
  - **Step 6**: Activity Summary and creation (SummaryStep).

### 2. Priority Lock on Fixed Activities
- WHEN an activity type is set to Fixed (`isFixed` is `true`), the priority selection on Step 3 MUST be locked to "alta" and disabled from being changed by the user.

### 3. Conditional Duration Fields
- Duration inputs (hours/minutes text boxes) MUST only be shown and required for optimizable (flexible) activities (`isFixed` is `false`).
- For fixed activities (`isFixed` is `true`), all duration inputs and frequent duration chips MUST be hidden.

### 4. End Hour Picker for Fixed Activities
- For fixed activities (`isFixed` is `true`), the time configuration step MUST render an "Hora de fin" (endHour) picker.
- The duration of each partition for a fixed activity MUST be computed under the hood as the difference in minutes between the selected `endHour` and `startTime`.
- Frequent duration chips (e.g., `30`, `60`, `90`, `120`) MUST be removed from the UI.

### 5. Time Config and Swipe UX Enhancements
- In `TimeConfigStep`, the `dayBadge` element MUST be removed from the header card.
- The modal/sheet header area MUST bind a `PanResponder` to allow dismissing the sheet via a natural swipe-down gesture.
- A dynamic loading overlay screen MUST be shown during the `handleSaveActivity` save execution to block UI interaction while processing.
- All titles, instructions, and buttons in the wizard MUST be translated to Neutral Spanish (e.g., replace "Seleccioná" with "Selecciona", "Configurá" with "Configura", "Guardá" with "Guarda").

---

## Scenarios

### Scenario 1: Creating an Optimizable Activity (Happy Path)
- **Given** the user is creating a new activity
- **When** the user inputs the name "Estudiar" and selects the identity "Tarea" on Step 1
- **Then** the dynamic icon next to the name input MUST be a checkmark circle icon
- **And** the activity type MUST default to Optimizable on Step 2
- **When** the user completes Step 2 (Difficulty: Normal) and Step 3 (Priority: Media)
- **And** selects "Lunes" on Step 4
- **And** configures a duration of `1 hora` and `30 minutos` (without a specific start time picker) on Step 5
- **And** clicks "Crear actividad" on Step 6
- **Then** the activity MUST be created successfully as FLEXIBLE with 90 minutes duration

### Scenario 2: Creating a Fixed Activity with End Hour Picker (Happy Path)
- **Given** the user is creating a new activity
- **When** the user selects the identity "Clase" on Step 1
- **Then** the activity type MUST default to Fixed and be disabled from being changed on Step 2
- **When** the user navigates to Step 3 (Priority & Deadline)
- **Then** the priority selection MUST be locked to "Alta" and disabled
- **When** the user selects "Martes" on Step 4
- **And** goes to Step 5 to configure time limits
- **Then** the start time picker MUST be shown, and the end time picker MUST be shown labeled "Hora de fin"
- **And** all duration input fields and chips MUST be hidden
- **When** the user selects start time `10:00` and end time `12:00`
- **Then** the system MUST compute a duration of `120` minutes under the hood
- **And** when the user completes the flow, the activity is successfully saved with the calculated duration

### Scenario 3: Swipe down to dismiss sheet (Happy Path)
- **Given** the user is anywhere in the activity creation wizard sheet
- **When** the user performs a swipe-down gesture on the sheet's header / drag handle area exceeding the threshold of `130` units
- **Then** the sheet MUST animate down and dismiss, navigating the user back

### Scenario 4: Loading overlay on save (Happy Path)
- **Given** the user is on the final Summary step of the wizard
- **When** the user clicks "Crear actividad"
- **Then** a loading overlay MUST cover the screen to prevent further inputs
- **And** once the save finishes, the overlay MUST disappear and navigate the user back to the Schedule view

### Scenario 5: Priority lock toggles dynamically (Edge Case)
- **Given** the user selects identity "Trabajo" on Step 1
- **And** selects type "Optimizable" on Step 2
- **When** the user proceeds to Step 3, the priority options (Baja, Normal, Alta) MUST be enabled and selectable
- **When** the user goes back to Step 2 and changes type to "Fijo"
- **And** goes forward to Step 3, the priority MUST be set to "Alta" and disabled
