# Specification: Settings

## Intent
Enhance settings security and usability by implementing an edit mode toggle, neutral Spanish localization, and madrugada/midnight boundary crossover validation logic.

## Requirements

### 1. Edit Mode Toggle
- By default, the settings screen MUST be in read-only mode.
- In read-only mode, the time picker cards MUST be disabled (non-clickable) and the "Guardar" button MUST be hidden.
- There MUST be an "Editar" button visible in the settings header or form area in read-only mode.
- WHEN the user presses "Editar", the screen MUST enter edit mode.
- In edit mode, the time pickers MUST become enabled, and the "Guardar" and "Cancelar" buttons MUST be visible.
- WHEN the user presses "Cancelar", edit mode MUST be deactivated, resetting any changes back to the active saved values, and restoring the read-only view.

### 2. Validation Ranges and Crossover Hours
- The time validation check for settings limits MUST reject the configuration if and only if the start time equals the end time (`startMin === endMin`).
- The validation logic MUST allow a crossover sleep window (e.g. start day at 09:00 and end day at 02:00 of the next day, where `startMin > endMin`).
- In `useScheduleStore` store, the bounds reset logic on load MUST only trigger if the loaded start time equals the end time (`startMin === endMin`), replacing the incorrect `>=` check.

### 3. Neutral Spanish Localization
- All settings labels, instructions, prompts, and alert dialogues MUST use Neutral Spanish.
- Specifically, the following conjugations MUST be replaced:
  - "querés" -> "quieres"
  - "definí" -> "define"
  - "guardá" -> "guarda"

---

## Scenarios

### Scenario 1: Toggle edit mode and successfully save changes (Happy Path)
- **Given** the user is viewing the Settings screen in the default read-only state
- **When** the user clicks the "Editar" button
- **Then** the screen MUST enter edit mode, showing the "Guardar" and "Cancelar" buttons and enabling the time pickers
- **When** the user selects a new start time of `07:30` and end time of `23:30`
- **And** clicks "Guardar"
- **Then** the system MUST display a confirmation dialog asking to save changes in Neutral Spanish
- **When** the user confirms the save
- **Then** the new day limits MUST be saved in storage and store
- **And** the schedule MUST be regenerated using the new day bounds
- **And** the screen MUST return to read-only mode, showing the updated times

### Scenario 2: Cancelling settings edit (Happy Path)
- **Given** the user is editing settings in edit mode with current saved values `08:00` to `22:00`
- **When** the user changes the start time to `06:00`
- **And** clicks "Cancelar"
- **Then** the screen MUST return to read-only mode
- **And** the start time MUST be restored to `08:00`

### Scenario 3: Crossover hours settings save (Edge Case)
- **Given** the user is in edit mode on the Settings screen
- **When** the user selects a start time of `08:00` and an end time of `02:00` (next day)
- **And** clicks "Guardar" and confirms
- **Then** the system MUST accept the configuration as valid
- **And** save the boundaries successfully
- **And** regenerate the schedule with bounds spanning across midnight

### Scenario 4: Error validation for identical bounds (Error State)
- **Given** the user is in edit mode on the Settings screen
- **When** the user selects start time `09:00` and end time `09:00`
- **And** clicks "Guardar"
- **Then** the settings flow MUST display a validation error alert
- **And** block saving of settings
