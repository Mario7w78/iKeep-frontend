# Design: Voice Quick Add

## Technical Approach

Alternative input channel following the existing external-service Clean Architecture pattern (`TaskSuggester` port → `ApiTaskSuggester` infra). `RegexVoiceActivityParser` (infrastructure) implements `VoiceActivityParser` (domain port). `ExpoSpeechRecognitionService` wraps `expo-speech-recognition`. `ParseVoiceActivityUseCase` orchestrates parsing and feeds the existing `CreateActivityUseCase` (reused, not wrapped). UX: mic FAB → `QuickAddVoiceView` (modal with live transcript) → `VoiceConfirmationSheet` (editable fields) → save via store.

## Architecture Decisions

### Decision: Parser port location — domain vs application

| Option | Tradeoff |
|--------|----------|
| Port only in `application/ports/out/` (like `TaskSuggester`) | Simpler, matches existing pattern |
| Port in `domain/services/` + re-export in `application/ports/out/` | Clean Architecture purist — domain defines the service contract |

**Choice**: Both. `domain/services/VoiceActivityParser.ts` defines the interface; `application/ports/out/VoiceActivityParser.ts` re-exports it. The parser produces domain primitives (`DayOfWeek`, `ActivityType`), so the contract belongs at domain level. Application re-exports for DI clarity.

### Decision: ParseVoiceActivityUseCase → CreateActivityUseCase relationship

| Option | Tradeoff |
|--------|----------|
| Wrap CreateActivityUseCase inside ParseVoiceActivityUseCase | Natural orchestration; single method to call from UI |
| Call CreateActivityUseCase directly from UI after parsing | Couples UI to two use cases; more wiring |

**Choice**: ParseVoiceActivityUseCase owns both parsing and saving. It exposes `parse(transcript)` for the parsing step and `confirmAndSave(parsed, edits)` which merges edits, applies type inference, builds a `CreateActivityCommand`, and delegates to `CreateActivityUseCase.execute()`. UI calls one hook, one use case.

### Decision: VoiceConfirmationSheet — separate component vs inline

| Option | Tradeoff |
|--------|----------|
| Inline in QuickAddVoiceView | Fewer files, but harder to test/reuse |
| Separate component | Follows existing pattern (NameIdentityStep, etc.), testable independently |

**Choice**: Separate component at `VoiceConfirmationSheet.tsx`. Receives `ParsedVoiceActivity`, renders editable fields, emits confirm/cancel. Follows the composable-step pattern from the existing wizard.

### Decision: Permission handling strategy

**Choice**: Request microphone permission on FAB tap via a `useMicrophonePermission` helper. If denied → show inline explanation with "Settings" deep-link. If restricted (iOS) → show unsupported message. Do NOT open the modal if permission is not granted. This avoids a half-broken UX where the modal opens but can't record.

### Decision: Navigation — how mic FAB opens the voice modal

**Choice**: Add `QuickAddVoiceModal` to `RootStackParamList` with `presentation: "transparentModal"` — identical to `CreateActivityModal`. Mic FAB calls `navigation.navigate("QuickAddVoiceModal")`. The voice modal is a separate stack screen, not a state toggle within HomeView, keeping HomeView clean.

## Data Flow

```
┌──────────────┐  tap mic  ┌───────────────────────────┐
│  HomeView     │ ───────→ │  QuickAddVoiceView (modal) │
│  [mic] [+add] │          │  ┌───────────────────┐    │
└──────────────┘          │  │ useVoiceCapture    │    │
                           │  │ start/stop/partial│    │
                           │  └────────┬──────────┘    │
                           │           │ transcript     │
                           │           ▼                │
                           │  ParseVoiceActivityUseCase │
                           │   .parse(transcript)       │
                           │           │                │
                           │           ▼                │
                           │  ┌─────────────────────┐  │
                           │  │ VoiceConfirmation   │  │
                           │  │ Sheet (editable)    │  │
                           │  └────────┬────────────┘  │
                           │           │ confirm        │
                           │           ▼                │
                           │  ParseVoiceActivityUseCase │
                           │   .confirmAndSave()        │
                           │    → CreateActivityUseCase │
                           │      → repository.save()   │
                           └───────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `domain/services/VoiceActivityParser.ts` | Create | Port: `parse(transcript) → ParsedVoiceActivity` |
| `application/ports/out/VoiceActivityParser.ts` | Create | Re-export from domain |
| `application/use-cases/ParseVoiceActivityUseCase.ts` | Create | Orchestrator: `parse()` + `confirmAndSave()` |
| `infrastructure/voice/RegexVoiceActivityParser.ts` | Create | Regex impl with Spanish day/time/identity patterns |
| `infrastructure/speech/ExpoSpeechRecognitionService.ts` | Create | Wraps `expo-speech-recognition` start/stop/events |
| `presentation/hooks/useVoiceCapture.ts` | Create | Manages recording lifecycle + permission |
| `presentation/screens/Activity/voiceCreation/QuickAddVoiceView.tsx` | Create | Main modal: recording → confirmation states |
| `presentation/screens/Activity/voiceCreation/VoiceConfirmationSheet.tsx` | Create | Editable parsed fields, save/cancel |
| `src/presentation/navigation/AppNavigator.tsx` | Modify | Add `QuickAddVoiceModal` to stack |
| `src/presentation/screens/Home/HomeView.tsx` | Modify | Add mic FAB alongside existing add FAB |
| `src/di/Dependencies.ts` | Modify | Wire `RegexVoiceActivityParser`, `ParseVoiceActivityUseCase` |
| `app.json` | Modify | Add `expo-speech-recognition` plugin |
| `package.json` | Modify | Add `expo-speech-recognition` dependency |

## Interfaces / Contracts

```typescript
// domain/services/VoiceActivityParser.ts
export interface ParsedVoiceActivity {
  identity?: "clase" | "trabajo" | "tarea";
  title?: string;
  days?: DayOfWeek[];
  startHour?: number;      // minutes from midnight
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  priority?: "baja" | "media" | "alta";
  difficulty?: "baja" | "media" | "alta";
  type?: ActivityType;     // explicit FIXED/FLEXIBLE override
}

export interface VoiceActivityParser {
  parse(transcript: string): ParsedVoiceActivity;
}
```

### Regex Parsing Strategy

| Pattern | Extracts | Spanish examples |
|---------|----------|-----------------|
| `^(clase|trabajo|tarea)\s+(de\s+)?(.+?)(?=\s+(los\|de\|prioridad\|dificultad\|desde\|a\s+las)\|$)` | identity + title | "Clase de matemáticas los lunes" → `{identity:clase, title:matemáticas}` |
| `(lunes\|martes\|miercoles\|miércoles\|jueves\|viernes\|sábado\|sabado\|domingo)` | days | "lunes y miércoles" → `[LUNES, MIERCOLES]` |
| `lunes\s+a\s+viernes` | expanded days | → `[LUNES..VIERNES]` |
| `todos\s+los\s+días` | all days | → `[LUNES..DOMINGO]` |
| `a\s+las\s+(\d{1,2})(?::(\d{2}))?` | start time | "a las 10" → `{startHour:10}` |
| `(?:desde\s+)?las?\s+(\d{1,2})(?::(\d{2}))?\s*(?:hasta\|a\s+las)\s+(\d{1,2})(?::(\d{2}))?` | range | "de 10 a 12" → `{startHour:10, endHour:12}` |
| `prioridad\s+(alta\|media\|baja\|\d)` | priority | "prioridad alta" → `{priority:alta}` |
| `dificultad\s+(alta\|media\|baja)` | difficulty | "dificultad baja" → `{difficulty:baja}` |
| `(fijo\|fija\|flexible)` | type override | "clase fija" → `{type:FIXED}` |

Type inference (fallback when no override): `clase` → FIXED, `trabajo`/`tarea` → FLEXIBLE.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `RegexVoiceActivityParser` | Jest parameterized with spec's 9 example inputs; verify each field extraction |
| Unit | `ParseVoiceActivityUseCase.parse()` | Mock parser; verify delegation and return |
| Unit | `ParseVoiceActivityUseCase.confirmAndSave()` | Mock both parser + CreateActivityUseCase; verify merge logic + command construction |
| Unit | `useVoiceCapture` hook | `renderHook` with mock `ExpoSpeechRecognitionService`; test start/stop/partial/final states |
| Unit | `VoiceConfirmationSheet` | Render with known parsed data; verify fields render; test edit + save emit |
| E2E | Full flow via Detox | Tap mic FAB → modal appears → transcript step → confirm → activity in list |

## Open Questions

- [ ] What is the actual API surface of `expo-speech-recognition`? Need to verify start/stop/onResult patterns before writing the wrapper.
- [ ] Should `expo-speech-recognition` be the choice or plain `expo-speech` (if it supports recognition)? Verify both.
