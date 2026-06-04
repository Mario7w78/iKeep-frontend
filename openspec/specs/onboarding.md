# Specification: Onboarding

## Intent
Improve the onboarding UX and stability by implementing username input, localization to Neutral Spanish, sunrise/sunset placeholders, and correct day limit validations.

## Requirements

### 1. Username Input Slide
- The onboarding flow MUST include a slide that collects the user's name/username.
- This username input field MUST bind to the application state (`useAppStore.username` and `setUsername`).
- The placeholder text for the username input MUST have an opacity of exactly `0.4`.
- The user MUST NOT be allowed to progress past this slide if the name field is empty or contains only whitespace.

### 2. Timepicker Placeholders
- Prior to time selection, sunrise (start of day) and sunset (end of day) time pickers MUST present a clear selection placeholder text displaying "Seleccionar la hora".

### 3. Neutral Spanish Localization
- All titles, descriptions, buttons, and alert messages in the onboarding slides MUST be translated to Neutral Spanish.
- Specifically, the following Argentinian conjugations MUST be replaced:
  - "Creá" -> "Crea"
  - "gestioná" -> "gestiona"
  - "Visualizá" -> "Visualiza"
  - "dejá" -> "deja"
  - "revisá" -> "revisa"

### 4. Sleep Window / Day Bounds Crossover Validation
- The validation check for day/sleep limits MUST reject the configuration if and only if the start time equals the end time (`startMin === endMin`).
- The validation logic MUST allow a crossover sleep window (e.g. start day at 08:00 and end day at 02:00 of the next day, which means `startMin > endMin`).
- If `startMin === endMin`, the onboarding flow MUST show a validation alert ("La hora de inicio y de fin no pueden ser iguales") and prevent completing the onboarding.

---

## Scenarios

### Scenario 1: Successfully entering username and completing onboarding (Happy Path)
- **Given** the user is on the first slide of the onboarding wizard
- **When** the user inputs a valid username "Juan"
- **And** continues through the slides to select a start time of `08:00` and end time of `22:00`
- **And** presses the "Empezar" button
- **Then** the username "Juan" MUST be stored in persistent state
- **And** the start time (`480` minutes) and end time (`1320` minutes) MUST be saved as day limits
- **And** the user navigation MUST proceed to the main home screen

### Scenario 2: Sleep window crossover setting (Edge Case)
- **Given** the user is configuring day limits during onboarding
- **When** the user selects a start time of `22:00` (late night)
- **And** selects an end time of `06:00` (early morning next day)
- **And** presses the "Empezar" button
- **Then** the system MUST validate the bounds as correct (since start time is not equal to end time)
- **And** save the bounds successfully to persistent storage
- **And** proceed to the main home screen

### Scenario 3: Missing username input (Error State)
- **Given** the user is on the username input slide of onboarding
- **When** the username input is empty
- **And** the user attempts to press "Siguiente"
- **Then** the onboarding flow MUST block slide progression
- **And** show a validation error indicating that a name is required

### Scenario 4: Equal start and end time limits (Error State)
- **Given** the user is at the final steps of onboarding configuring time limits
- **When** the user sets both start time and end time to `08:00`
- **And** presses the "Empezar" button
- **Then** the onboarding flow MUST display a validation error alert
- **And** block onboarding completion
