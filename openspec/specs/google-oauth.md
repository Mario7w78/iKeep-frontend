# Specification: Google OAuth

## Intent
OAuth 2.0 PKCE connect/disconnect flow for Google Calendar. Stores refresh tokens encrypted (Fernet), validates callback state, and reports connection status to the app. v1 is read-only (`calendar.readonly` scope), primary calendar only. The app never sees raw tokens; the backend owns the entire exchange.

## Requirements

### 1. PKCE connect flow
- The system MUST initiate a PKCE OAuth flow from the app (`openAuthSessionAsync(auth_url, 'lotus://google/callback')`), redirect through the backend callback `https://ikeep-backend.onrender.com/api/v1/google/oauth/callback`, exchange the authorization code for tokens server-side, and store the refresh token encrypted (Fernet).
- The code_verifier SHALL travel inside a signed JWT `state` produced at flow start (backend-owned PKCE).
- The token upsert SHALL use a service-role client (the browser callback carries no Supabase JWT); `user_id` MUST come exclusively from the signed state claims, never from request bodies.
- The flow MUST report success or failure to the app (deep link + `/estado` confirmation).

### 2. State validation
- The backend MUST validate the OAuth `state` parameter against the value issued at flow start (HS256 + dedicated secret, exp ≤10 min) and MUST reject callbacks with missing, expired, or mismatched state fail-closed (redirect `state_invalido`, nothing stored).

### 3. Missing or misconfigured credentials
- The system MUST return a clear configuration error (503, non-crash, actionable message) when GOOGLE_CLIENT_ID/SECRET are missing or invalid, both at flow start and at code exchange.

### 4. Disconnect
- Disconnect MUST revoke tokens at Google when possible AND delete the user's `google_tokens`, `google_events`, and `sync_tokens` rows.
- Disconnecting when never connected MUST be a no-op success with no Google call.

### 5. Token refresh and revocation handling
- The system MUST transparently refresh an expired access_token during any Google API call (refresh-once, ~60 s expiry margin). Refresh tokens are Fernet-encrypted at rest; decryption happens only in-memory; tokens are never logged nor present in any response schema.
- If the refresh token is revoked or permanently expired (`invalid_grant`-class), the system MUST surface a clean re-auth signal (401-mapped "reconnect required") instead of an opaque failure.

---

## Scenarios

### Scenario 1: Successful connect (Happy Path)
- **Given** a user not yet connected and valid GOOGLE_CLIENT_ID/SECRET
- **When** the user completes the browser consent and the code is exchanged
- **Then** `google_tokens` contains a row scoped to the user with an encrypted refresh token
- **And** the app receives a success signal

### Scenario 2: User cancels consent in browser (Edge Case)
- **Given** the connect flow started
- **When** the user closes/cancels the browser session
- **Then** no token rows are written and the app shows connect was not completed (`status=error` redirect)

### Scenario 3: Forged callback rejected (Security)
- **Given** an attacker crafts a callback with an invalid state value
- **When** the callback endpoint receives it
- **Then** it responds with a validation error and no tokens are stored (empty-secret HMAC forgery fails closed via PyJWT)

### Scenario 4: Backend starts connect without credentials configured (Config Error)
- **Given** GOOGLE_CLIENT_ID/SECRET are absent or malformed on the server
- **When** the app requests the connect start
- **Then** it receives a distinguishable config-error response (503, not a 500 crash)

### Scenario 5: Disconnect while connected (Happy Path)
- **Given** a connected user
- **When** disconnect is invoked
- **Then** zero rows remain in `google_tokens`, `google_events`, `sync_tokens` for that user
- **And** revocation is attempted against Google

### Scenario 6: Disconnect when never connected (No-Op)
- **Given** a user with no stored tokens
- **When** disconnect is invoked
- **Then** the operation succeeds as a no-op without calling Google

### Scenario 7: Access token expired mid-call (Happy Path)
- **Given** a valid stored refresh token and an expired access token
- **When** any Google call executes
- **Then** the access token is refreshed once and the original call proceeds

### Scenario 8: Refresh token revoked by user (Recovery Path)
- **Given** Google rejects the refresh with an invalid_grant-class error
- **When** the user loads the calendar
- **Then** the app receives a reconnect-required signal (401-mapped) and Settings shows disconnected/reconnect state
