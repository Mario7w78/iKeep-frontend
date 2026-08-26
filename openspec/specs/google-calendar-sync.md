# Specification: Google Calendar Sync

## Intent
Pull-based sync of the user's primary Google Calendar into `google_events`, served through a dedicated endpoint isolated from core `/calendario`. Incremental via cached `syncToken` with full-sync fallback on 410 GONE; read-only, primary calendar only. Google failures must never degrade the core calendar contract.

## Requirements

### 1. Sync-on-request endpoint
- The system MUST expose `GET /api/v1/calendario/google?desde&hasta` as a SEPARATE endpoint from `/calendario`.
- On request it MUST sync (incremental when a valid syncToken exists), then serve events overlapping [desde, hasta] exactly as sent by the client (the full padded grid range).
- Range validation MUST match `/calendario` parity: identical 422 shape and same 120-day cap.

### 2. Incremental sync with full-sync fallback
- The system SHOULD use the stored syncToken for incremental pulls.
- When Google responds 410 GONE (token invalid/expired), the system MUST clear the token and fall back to one full sync transparently, still returning correct results.
- The two credential domains are non-interchangeable: only `google.list_events` receives the Google access token; every repository call receives the request's Supabase JWT (`jwt_supabase`) — they MUST never cross.

### 3. Event persistence and user scoping
- The system MUST persist synced events in `google_events` scoped by `user_id` with RLS enforcing `auth.uid() = user_id`. A user MUST NOT be able to read another user's events under any code path.

### 4. Multi-day and all-day events
- The system MUST support multi-day and all-day events. A multi-day event MUST be served on every day it overlaps within the requested range (both-side clipping to the range). All-day events map to their date(s) without time-of-day semantics (exclusive end `fin − 1d`; timed midnight-end also `− 1d`).

### 5. singleEvents semantics
- The system MUST call Google with `singleEvents=true` so recurring events arrive pre-expanded within the window; no client-side recurrence expansion is performed.

### 6. Isolation from core calendar failures
- A Google API failure, network timeout, or quota/rate-limit error MUST produce an isolated error response on the google endpoint only. Core `/calendario` behavior MUST remain unaffected.
- Rate-limit/quota errors MUST be handled gracefully (distinguishable retryable-error signal, not crash, not infinite retry), serving previously cached data if available.

### 7. Disconnected behavior
- When the user has no stored tokens, the endpoint MUST return a "not connected" state (200) without calling Google, with no errors surfaced as failures by the UI.

---

## Scenarios

### Scenario 1: Month load with connection active (Happy Path)
- **Given** a connected user and a desde/hasta range
- **When** GET /api/v1/calendario/google is called
- **Then** it returns imported events overlapping that range without touching /calendario responses

### Scenario 2: Valid incremental token (Happy Path)
- **Given** a stored, still-valid syncToken
- **When** sync runs
- **Then** only changes since the last pull are fetched and `google_events` is updated accordingly

### Scenario 3: Stale token returns 410 GONE (Recovery Path)
- **Given** a stored syncToken rejected by Google with 410
- **When** sync runs
- **Then** the system clears the token, performs one full sync, and still returns correct results
- **And** credentials stay in their own sinks across both passes

### Scenario 4: Cross-user isolation via RLS (Security)
- **Given** two users each with persisted google_events
- **When** user A queries events through the repository/endpoint
- **Then** only user A's rows are returned; no cross-user leak is observable

### Scenario 5: Multi-day event spanning range edges (Edge Case)
- **Given** an event from day 3 to day 6 of the requested month grid
- **When** events are returned/rendered
- **Then** days 3–6 each include the event, clipped to the requested range

### Scenario 6: All-day event (Edge Case)
- **Given** an all-day event on a date inside the range
- **When** events are queried
- **Then** the event appears on exactly that date (multi-day all-day counts real days)

### Scenario 7: Weekly recurring event (Happy Path)
- **Given** a weekly recurring event whose occurrences fall in the range
- **When** sync runs with singleEvents=true
- **Then** each occurrence is stored/served as its own instance; no expansion logic exists app-side

### Scenario 8: Google outage during month load (Failure Isolation)
- **Given** Google Calendar API is unreachable
- **When** the app loads a month
- **Then** the google endpoint returns an isolated error while /calendario succeeds normally
- **And** the UI shows the imported section error state

### Scenario 9: Quota exceeded (Graceful Degradation)
- **Given** Google returns a rate-limit/quota error
- **When** sync runs
- **Then** the endpoint responds gracefully with a retryable-error signal, no crash, and serves any previously cached data if available

### Scenario 10: Disconnected month load (No-Op)
- **Given** a user with no stored tokens
- **When** GET /api/v1/calendario/google is called
- **Then** it responds 200 "not connected" with zero calls to Google
