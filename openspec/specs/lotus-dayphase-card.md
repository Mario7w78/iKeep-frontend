# Specification: Lotus Day-Phase Card

## Intent
A `LotusLandscape` component renders `assets/mascot/lotus_landscape.riv` as HomeView's main card (cuadro principal). It selects a day phase from the device's local hour and plays the matching one-shot phase animation (`Morning`, `Evening`, or `Night`) over continuous ambient loops (`Cloud_Loop`, `Nenufar_Loop`). The Rive state machine has zero inputs, so playback is imperative. The phase re-evaluates when the app returns to foreground, guarded against spurious replays within the same phase.

## Requirements

### 1. Day-phase selector pure function
- The system MUST expose a pure selector `faseDelDia(horaLocal)` with explicit, testable boundaries: hour [0–11] → Morning; [12–19] → Evening; [20–23] → Night (mañana < 12, tarde 12–19 inclusive, noche ≥ 20).

### 2. Re-evaluation on app resume
- The system MUST recompute the day phase when the app transitions from background to foreground (AppState listener, `subscription.remove()` cleanup), so the card reflects current time without remounting HomeView.
- If the recomputed phase equals the previous value, NO phase animation MAY restart (no duplicate `play()` of Morning/Evening/Night), and ambient loops MUST NOT be restarted.

### 3. HomeView main card placement
- LotusLandscape MUST render as HomeView's first ScrollView child, above the header row, occupying the cuadro principal slot; header `<Sapo>` call site remains intact elsewhere.
- The Rive runtime MUST receive the lotus asset reference on mount.

### 4. One-shot phase animation over ambient loops
- The system MUST play the selected phase animation exactly once (one-shot) while ambient loops (`Cloud_Loop`, `Nenufar_Loop`) keep looping underneath; after the one-shot finishes, ambient loops persist uninterrupted.

### 5. Missing-asset graceful degradation
- The system MUST NOT crash when the lotus asset fails to resolve — mirroring Sapo's guarded-require behavior — rendering an empty placeholder card instead; HomeView MUST still render.

---

## Scenarios

### Scenario 1: Boundary hours map to correct phase (Happy Path)
- **Given** the `faseDelDia` selector
- **When** called with hour = 0 or 11
- **Then** it returns "Morning"
- **And** called with 12, 15, or 19 it returns "Evening"; called with 20, 21, or 23 it returns "Night"

### Scenario 2: Phase updates after returning from background (Happy Path)
- **Given** the app is foregrounded at hour 10 showing Morning
- **When** the app goes to background and returns at hour 22
- **Then** the phase recomputes to Night
- **And** `play("Night")` is invoked on the mocked Rive runtime

### Scenario 3: No spurious replay within same phase (Edge Case)
- **Given** the app resumes within the same phase window
- **When** the phase recomputes to an unchanged value
- **Then** no phase animation restarts (no duplicate `play()` of Morning/Evening/Night)

### Scenario 4: Card renders on Home mount (Happy Path)
- **Given** HomeView mounts
- **When** the tree renders
- **Then** LotusLandscape occupies the cuadro principal slot (first ScrollView child above header)
- **And** the mocked Rive component receives the lotus asset reference

### Scenario 5: Phase plays once over ambience (Constraint)
- **Given** phase resolves to "Evening"
- **When** the card renders
- **Then** `play("Evening")` is called exactly once
- **And** `Cloud_Loop` and `Nenufar_Loop` are playing concurrently and keep looping

### Scenario 6: Asset missing renders placeholder (Edge Case)
- **Given** the `.riv` require throws or resolves null
- **When** LotusLandscape renders inside HomeView
- **Then** no exception propagates, HomeView still renders, and a sized placeholder occupies the card slot
