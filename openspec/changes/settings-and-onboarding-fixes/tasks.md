# Tasks: Settings and Onboarding Fixes

## Phase 1: Foundation
- [x] Add `username` string and `setUsername` to onboarding state in `src/infrastructure/store/useAppStore.ts`.
- [x] Modify `src/infrastructure/store/useScheduleStore.ts` to trigger boundary resets on load only when hours are equal (`===`).

## Phase 2: Onboarding & Settings Refactoring
- [x] Integrate username input, replace Argentinian Spanish with neutral Spanish, and validate limits with `===` in `src/presentation/components/organisms/Onboarding/OnboardingView.tsx`.
- [x] Read `username` in `src/presentation/screens/Home/HomeView.tsx` to display greeting dynamically, and convert alerts to neutral Spanish.
- [x] Add read/edit toggles, confirm dialogs, edit resets, and validation checks using `===` in `src/presentation/screens/Settings/SettingsView.tsx`.

## Phase 3: Stepped Activity Wizard Refactoring
- [ ] Create wizard Step 1 component at `src/presentation/components/organisms/CreateActivity/NameIdentityStep.tsx`.
- [ ] Create wizard Step 2 component at `src/presentation/components/organisms/CreateActivity/TypeDifficultyStep.tsx`.
- [ ] Delete legacy combined component at `src/presentation/components/organisms/CreateActivity/NameTypeStep.tsx`.
- [ ] Update `src/presentation/hooks/useTimeForm.ts` to calculate duration (`endHour - startHour`) for fixed events, default `isFixed` for tasks, lock selections, and export `setEndTime`.
- [ ] Refactor `src/presentation/screens/Activity/activityCreation/CreateActivityView.tsx` to implement 6-step progress state, next/back navigation, and saving/loading overlay.
- [ ] Lock priority select to "alta" for fixed events in `src/presentation/components/organisms/CreateActivity/PriorityDeadlineStep.tsx`.
- [ ] Remove `dayBadge` header element from `src/presentation/components/organisms/CreateActivity/TimeConfigStep.tsx`.
- [ ] Modify `src/presentation/components/molecules/CreateActivity/TimePartitionForm.tsx` to render conditional `endHour` datepicker and hide duration input when fixed.

## Phase 4: UI Adjustments & Schedule Grid
- [ ] Add view toggle button in `src/presentation/components/organisms/Schedule/ScheduleHeader.tsx`.
- [ ] Implement toggle state, render chronological list / grid views, and apply height constraints in `src/presentation/screens/Schedule/ScheduleView.tsx`.
- [ ] Add `PanResponder` vertical swipe-down dismissal to modal in `src/presentation/components/organisms/Schedule/ActivityDetailModal.tsx`.

## Phase 5: Verification
- [ ] Execute compilation validation using `npx tsc --noEmit`.
- [ ] Verify onboarding registration and the 6-step wizard workflow manually.

## Review Workload Forecast
- Estimated changed lines: 450-550
- 400-line budget risk: High
- Chained PRs recommended: Yes
- Chain strategy: stacked-to-main
- Decision needed before apply: Yes
- Delivery strategy: ask-on-risk
- Suggested work-unit PR split:
  - PR 1: Phase 1 & 2 (Foundation, Onboarding & Settings)
  - PR 2: Phase 3 (Wizard Refactoring & Hooks)
  - PR 3: Phase 4 & 5 (Schedule Grid, swipe gesture modal & verification)
