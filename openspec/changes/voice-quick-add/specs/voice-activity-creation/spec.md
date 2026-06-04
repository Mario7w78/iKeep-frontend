# Voice Activity Creation Specification

## Purpose

Voice-based conversational alternative to the 5-step wizard for creating activities. Users describe the activity naturally and the system parses it into structured data via regex, skipping the progressive form flow.

## Requirements

### 1. Voice Entry Point

The Home screen MUST render a mic FAB as the entry to the voice creation flow.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Happy path | User on Home | Taps mic FAB | Modal opens, mic starts listening |
| Permission denied | Mic permission denied | Taps mic FAB | Permission explanation shown; modal NOT opened |
| iOS restricted | Permission restricted | Taps mic FAB | Unsupported-device message; modal NOT opened |

### 2. Real-time Transcript

While recording, the modal MUST display a live transcript of recognized speech.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Live update | Modal is recording | User speaks | Transcript updates in real time |
| Interim results | User mid-sentence | Interim result emitted | Transcript shows partial text without freezing |

### 3. Parsing (Regex — MVP)

The system MUST parse the final transcript using regex to extract identity, title, days, times, priority, difficulty, and type.

| # | Input | Extracted |
|---|-------|-----------|
| 1 | "Clase de matemáticas los lunes y miércoles de 10 a 12" | identity=clase, title=matemáticas, days=[LUNES,MIERCOLES], startHour=10, endHour=12 |
| 2 | "Trabajo de investigación prioridad alta dificultad baja" | identity=trabajo, title=investigación, priority=5, difficulty=baja |
| 3 | "lunes a viernes" | days=[LUNES,MARTES,MIERCOLES,JUEVES,VIERNES] |
| 4 | "todos los días" | days=[LUNES..DOMINGO] |
| 5 | "prioridad 5" | priority=5 |
| 6 | "estudiar álgebra los martes" | identity=tarea, title=álgebra, days=[MARTES] |
| 7 | "a las 10" | startHour=10 |
| 8 | "clase fija los lunes" | type=FIXED (overrides inference) |
| 9 | "desde las 14:30 hasta las 16" | startHour=14, startMinute=30, endHour=16 |

### 4. Type Inference Rules

- Identity "clase" → type SHALL default to FIXED
- Identity "trabajo" or "tarea" → type SHALL default to FLEXIBLE
- Explicit "fijo"/"flexible" in transcript MUST override inferred type

### 5. Confirmation Sheet

After parsing, the modal MUST transition to an editable confirmation sheet.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Full display | Parsing completed | Sheet appears | All extracted fields shown as editable inputs |
| Missing fields | Some fields not extracted | Sheet appears | Missing fields show defaults (title: empty, priority: 3, difficulty: media) with visual cue |
| User edits | Sheet shown | User modifies a field | Field value updates to user input |
| Save | User taps "Crear actividad" | Validation passes | Activity created via CreateActivityUseCase with current field values |
| Validation fail | Required field empty | Taps "Crear actividad" | Inline validation error shown; activity NOT created |
| Cancel | Sheet shown | Taps dismiss | Modal closes; no data saved |

### 6. Parsing Failure & Retry

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Empty result | Parser returns nothing | After stop | Fallback message: retry or use manual wizard |
| Empty transcript | User stopped without speaking | After stop | Error message; user MAY retry |
| No recognition | Speech returned no results | After timeout | Notification with retry option |

### 7. Cancel Flow

- GIVEN the voice modal is open (listening or confirmation)
- WHEN the user taps the close button
- THEN the modal MUST dismiss without saving
- AND recording MUST stop if still active
