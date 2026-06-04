# Tasks: Voice Quick Add

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation → PR 2: Speech+Wiring → PR 3: UI |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain port + Regex parser + Use case + unit tests | PR 1 | Base = feature/tracker branch |
| 2 | Speech service + hook + DI + config | PR 2 | Base = PR 1 branch; depends on PR 1 types |
| 3 | Modal + confirmation sheet + navigation + mic FAB | PR 3 | Base = PR 2 branch; depends on PR 2 wiring |

## Phase 1: Foundation (Domain + Infrastructure)

- [x] 1.1 Create `domain/services/VoiceActivityParser.ts` — `ParsedVoiceActivity` type + `VoiceActivityParser` interface
- [x] 1.2 Create `application/ports/out/VoiceActivityParser.ts` — re-export from domain
- [x] 1.3 Create `infrastructure/voice/RegexVoiceActivityParser.ts` — regex parser with 9 patterns + type inference
- [x] 1.4 Create `application/use-cases/ParseVoiceActivityUseCase.ts` — `parse()` + `confirmAndSave()` orchestrator
- [ ] 1.5 Unit tests: `RegexVoiceActivityParser` parameterized against spec's 9 example inputs (skipped — no test framework)

## Phase 2: Speech Service + Wiring

- [x] 2.1 Create `infrastructure/speech/ExpoSpeechRecognitionService.ts` — STT wrapper (start/stop/events)
- [x] 2.2 Create `presentation/hooks/useVoiceCapture.ts` — recording lifecycle + permission handling
- [x] 2.3 Wire `RegexVoiceActivityParser` + `ParseVoiceActivityUseCase` in `src/di/Dependencies.ts`
- [x] 2.4 Add `expo-speech-recognition` plugin to `app.json` and dependency to `package.json`

## Phase 3: UI + Navigation

- [x] 3.1 Create `VoiceConfirmationSheet.tsx` — editable parsed fields, confirm/cancel emits
- [x] 3.2 Create `QuickAddVoiceView.tsx` — modal with recording state → confirmation state transition
- [x] 3.3 Add `QuickAddVoiceModal` route to `AppNavigator.tsx` RootStackParamList + stack
- [x] 3.4 Add mic FAB to `HomeView.tsx` — navigates to `QuickAddVoiceModal` on tap

## Phase 4: Testing

- [ ] 4.1 Unit tests: `ParseVoiceActivityUseCase` — mock parser, test `parse()` + `confirmAndSave()` merge logic
- [ ] 4.2 Unit tests: `useVoiceCapture` — `renderHook` with mock speech service; start/stop/partial/final states
- [ ] 4.3 Unit tests: `VoiceConfirmationSheet` — render fields, edit, save confirm, cancel
- [ ] 4.4 E2E test: full flow — tap mic FAB → modal → transcript → confirm → activity appears in list
