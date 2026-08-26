# Specification: Day Close Recap

## Intent
After a successful day close ("¿Cómo te fue hoy?" → DayClose), show a warm, passive recap once: completed counts ("hiciste X de Y"), current streak, and one highlighted area derived client-side. Zero input friction, zero network calls. Closes the emotional loop of the daily flow; tone follows DayClose philosophy — numbers are never judgment (especially on `dificil`).

## Requirements

### 1. Passive recap renders once after day close
- The system MUST render a passive recap (`DayRecap`) immediately after `onResponder` resolves a successful `cerrar()`, showing completed counts as "hiciste X de Y".
- Counts MUST be sourced exclusively from the existing `useRewardsStore` post-`cerrar()` snapshot.
- The recap MUST NOT initiate any fetch, API, or network request during mount or render (no network calls by the recap or its helpers).
- The recap MUST be set visible ONLY on the success path of `cerrar()` (failure path shows no recap).

### 2. Streak display from store
- The recap MUST display the current streak value read directly from `useRewardsStore` at render time.
- It MUST NOT compute, fetch, or persist streak data independently.

### 3. Area destacada shows single winner only
- The recap MUST derive a highlighted area client-side from completed items' `activity.area` in `todayItems`.
- Exactly one leading area MUST be shown; on a tie between top areas, NO area destacada MAY be shown, and the rest of the recap layout MUST remain intact.
- Derivation SHALL be a pure side-effect-free helper (`areaDestacada(items, hechasIds)`): items without a declared area MUST be ignored, only completed items count, strict-majority wins (a late item may break an earlier tie), tie or zero completions → no area.

### 4. Dificil tone contract
- When `respuestaCierre` is `dificil`, the recap MUST use warm copy that NEVER frames numbers or outcomes as judgment of the user.
- Numeric counts SHALL be de-emphasized or absent from the primary message in this variant (the dificil branch renders no digits in its visible text).
- Tone MUST stay consistent with DayClose philosophy across both variants; non-dificil variants keep counts, streak, and area destacada per their own requirements.

### 5. Tap-only dismissal, once per day
- The recap MUST dismiss on tap only — never via auto-dismiss timer — and dismissal MUST leave no residual overlay blocking Home interaction.
- After dismissal it MUST NOT reappear for the remainder of the same day: visibility is double-gated by local state AND `diaCerrado === hoyISO`, respecting the existing `yaCerro` gate that prevents re-closing the day.

### 6. Zero-completion edge case
- The recap MUST render correctly when zero items were completed (all unresolved): layout MUST not break, overlap, or collapse.
- It MAY show streak-only or gentle empty-state copy instead of numeric counts.

---

## Scenarios

### Scenario 1: Recap shows correct counts after close (Happy Path)
- **Given** the store snapshot has 4 hechas out of 7 items
- **When** the user completes DayClose and `cerrar()` resolves successfully
- **Then** the recap MUST render showing "hiciste 4 de 7"
- **And** the counts MUST equal the store snapshot values exactly

### Scenario 2: No network activity during render (Constraint)
- **Given** the rewards store already holds post-close data
- **When** the recap mounts and renders
- **Then** no fetch, API, or network request MUST be initiated by the recap or its helpers

### Scenario 3: Streak value matches store (Happy Path)
- **Given** the store holds `racha = 5`
- **When** the recap renders
- **Then** it MUST show the streak as 5

### Scenario 4: Single winner is highlighted (Happy Path)
- **Given** completed items map to areas such that "Salud" has the highest count
- **When** the recap renders
- **Then** it MUST show "Salud" as area destacada

### Scenario 5: Tie hides area destacada entirely (Edge Case)
- **Given** two areas share the top count among completed items
- **When** the recap renders
- **Then** NO area destacada section MUST appear
- **And** the rest of the recap layout MUST remain intact

### Scenario 6: Dificil variant avoids judgmental framing (Tone Contract)
- **Given** the user answered `dificil` on DayClose with 1 de 8 done
- **When** the recap renders
- **Then** the copy MUST be warm and non-judgmental (no deficit framing)
- **And** numeric counts MUST be de-emphasized or absent from the primary message

### Scenario 7: Non-dificil variant keeps standard warm recap (Happy Path)
- **Given** the user answered any non-`dificil` option
- **When** the recap renders
- **Then** it MUST show counts, streak, and area destacada per their own requirements

### Scenario 8: Tap dismisses the recap (Happy Path)
- **Given** the recap is visible after a successful close
- **When** the user taps anywhere on the recap
- **Then** it MUST disappear without leaving residual overlay blocking Home interaction

### Scenario 9: Recap does not reappear same day (Edge Case)
- **Given** the user dismissed the recap earlier today and `yaCerro` is true
- **When** the user navigates away from and back to HomeView
- **Then** the recap MUST NOT reappear

### Scenario 10: All-unresolved day renders stable layout (Edge Case)
- **Given** the store snapshot has 0 hechas out of 9 items and no derivable area destacada
- **When** the recap renders
- **Then** it MUST render without layout errors
- **And** it MAY show streak-only or gentle empty-state copy instead of counts
