# Specification: External Events UI

## Intent
Read-only rendering of imported Google Calendar events in the month view, plus the Settings connect/disconnect entry point. Imported events are visually distinct from own activities and never editable. A dedicated store (`useGoogleCalendarStore`) keeps Google state isolated from the core calendar; when disconnected, zero google-related requests fire.

## Requirements

### 1. Month grid rendering of imported events
- The app MUST render imported events in MonthGrid day detail and as day dots with a DISTINCT style (color/shape) from activity dots.
- Titles MUST render exactly as imported — no text prefix and no badge.
- Multi-day events MUST appear on every overlapped day shown in the grid (server `dias` expansion map → client `porDia`).
- Activity dots keep priority on the 3-dot row; imported dots fill remaining slots only — activities never lose their place to imports.

### 2. Read-only guarantee
- No imported event SHALL be editable, deletable, or openable into any edit flow through the app UI.
- Imported events MUST NOT feed activity-creation or autofill flows.

### 3. Settings connect entry point
- Settings MUST provide a Connect/Disconnect section with clear connected/disconnected states, including a reconnect-required state surfaced when tokens were revoked server-side (401-mapped signal → `estado='reconexion'`, cached `porDia` cleared).
- Connect uses `openAuthSessionAsync(auth_url, 'lotus://google/callback')` and confirms via `/estado`; `/estado` is consulted at most once per session unless state is unknown.
- Disconnect wipes local data only after server DELETE succeeds; if DELETE fails, state stays connected and the error surfaces in the section (never claim "desconectado" while tokens remain alive).

### 4. Section states
- The imported-events section MUST have distinguishable loading (`cargando` → ActivityIndicator), error (isolated `error`; stale data kept and labeled), empty, and populated states, without blocking core activities rendering.
- Google errors MUST never enter `useCalendarStore`.

### 5. Disconnected UI behavior
- When disconnected, the app MUST make zero google-related requests (`verificado` flag stays true after explicit disconnect so month navigation makes zero calls) and hide/collapse all imported-event sections; no stale imported data renders.

---

## Scenarios

### Scenario 1: Imported event visible in day detail (Happy Path)
- **Given** a connected user with an event overlapping day X in range
- **When** the month/day detail for day X renders
- **Then** the event appears with its original title and distinct dot styling

### Scenario 2: Multi-day event across grid padding (Edge Case)
- **Given** a multi-day event overlapping several padded days
- **When** the month view renders
- **Then** the event appears on every overlapped day shown in the grid

### Scenario 3: Tap on imported event (Read-Only Contract)
- **Given** an imported event displayed in day detail
- **When** the user taps it
- **Then** no edit/delete affordance appears; at most read-only info is shown

### Scenario 4: Connect from Settings (Happy Path)
- **Given** a disconnected user
- **When** they tap Connect and complete OAuth
- **Then** Settings reflects the connected state

### Scenario 5: Reconnect required after revocation (Recovery Path)
- **Given** Google revoked the refresh token
- **When** the app receives the 401-mapped re-auth signal
- **Then** Settings shows a reconnect state prompting a new connect flow and cached day data is cleared

### Scenario 6: Disconnect from Settings (Happy Path)
- **Given** a connected user
- **When** they tap Disconnect
- **Then** Settings returns to disconnected state and no local data remains

### Scenario 7: Loading while syncing (UI State)
- **Given** a connected user opening a month not yet cached
- **While** sync runs
- **Then** the section shows a loading indicator without blocking core activities rendering

### Scenario 8: Error state on Google failure (Failure Isolation)
- **Given** a Google API/network failure
- **When** the google endpoint returns its isolated error
- **Then** the section shows an error state; core calendar content remains fully usable

### Scenario 9: Empty state (Edge Case)
- **Given** a connected account whose calendar has no events in range
- **When** the month renders
- **Then** the section falls back to the generic day-detail empty message (not an error)

### Scenario 10: Fresh disconnect then month navigation (Constraint)
- **Given** the user just disconnected
- **When** they navigate between months
- **Then** no google endpoint calls fire and no imported dots/details appear
