# Proposal: Voice Quick Add

## Intent
Voice-based conversational alternative to the 5-step wizard for creating activities. Users describe the activity naturally ("Clase de matemáticas los lunes a las 10") and the system parses it into structured data, skipping progressive form filling.

## Scope

### In Scope
- Mic FAB on Home screen as entry point to voice flow
- Voice capture modal with real-time transcript display
- Regex parsing: days of week, times, explicit numbers
- Confirmation sheet with editable parsed fields before save
- Feed parsed data into existing CreateActivityUseCase

### Out of Scope
- LLM/NLP inference layer (deferred; MVP is regex-only)
- Batch mode ("Crear y agregar otra")
- Voice commands for edit/delete or other features
- Multilingual support beyond Spanish

## Capabilities

### New Capabilities
- `voice-activity-creation`: Parse natural voice input into structured activity data and create activities via a conversational voice flow

### Modified Capabilities
None — existing wizard stays untouched.

## Approach
Alternative input channel via Clean Architecture. `RegexVoiceActivityParser` (infrastructure) implements `VoiceActivityParser` (domain port). `ExpoSpeechRecognitionService` wraps `expo-speech-recognition` for audio capture. `ParseVoiceActivityUseCase` orchestrates parsing and feeds `CreateActivityUseCase`. UX: mic FAB → `QuickAddVoiceView` (modal, listening + transcript) → `VoiceConfirmationSheet` (edit fields) → save.

## Affected Areas
| Area | Impact | Description |
|------|--------|-------------|
| `domain/services/VoiceActivityParser.ts` | New | Port interface |
| `application/use-cases/ParseVoiceActivityUseCase.ts` | New | Orchestrator |
| `infrastructure/voice/RegexVoiceActivityParser.ts` | New | Regex parser impl |
| `infrastructure/speech/ExpoSpeechRecognitionService.ts` | New | Speech wrapper |
| `presentation/screens/Activity/voiceCreation/` | New | UI: modal + sheet |
| Home screen | Modified | Mic FAB added |

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Voice recognition accuracy | Med | Always confirm before saving; show live transcript |
| `expo-speech-recognition` API changes | Low | Wrap in adapter; pin version |
| Regex misses complex utterances | Med | MVP covers common patterns; LLM layer deferred |

## Rollback Plan
Revert the commit adding voice files. Remove mic FAB from Home screen — restores original UX. No existing specs changed, rollback is safe.

## Dependencies
- `expo-speech-recognition` (npm)
- iOS: `NSSpeechRecognitionUsageDescription` in Info.plist
- Android: `RECORD_AUDIO` permission

## Success Criteria
- [ ] Spoken "Clase de matemáticas los lunes y miércoles a las 10" → parsed as identity=Clase, name=matemáticas, days=[L,Mi], time=10:00
- [ ] Confirmation sheet shows parsed fields; user can edit before saving
- [ ] Activity saved matches parsed data
- [ ] Regex parser handles all MVP patterns: day combos, time ranges, identity detection
