/**
 * Single source of truth for the backend URL.
 *
 * The host runs on Render's free tier, which puts the instance to sleep after
 * ~15 minutes of inactivity. Waking it costs 20-50s, so the first request
 * after an idle period needs a much longer budget than the rest.
 */

export const API_ROOT = 'https://ikeep-backend.onrender.com';
export const API_BASE_URL = `${API_ROOT}/api/v1/horarios`;

/** Budget for the first attempt, sized to survive a cold start. */
export const COLD_START_TIMEOUT_MS = 60_000;
/** Budget for retries, by which point the instance is awake. */
export const WARM_TIMEOUT_MS = 25_000;

/**
 * Shortest gap between two warm-up pings.
 *
 * The instance only sleeps after ~15 minutes idle, so pinging more often than
 * this buys nothing. It matters because the app warms up from several places
 * — launch, returning to the foreground, opening the chat — and a user
 * switching apps back and forth would otherwise fire a burst of requests.
 */
export const WARM_UP_THROTTLE_MS = 60_000;

let lastWarmUpAt = 0;

/**
 * Fire-and-forget ping to wake the instance.
 *
 * Called whenever the user is about to need the backend. The seconds they
 * spend navigating or typing are the window used to boot the server, so their
 * first real request does not have to absorb the cold start.
 *
 * Never throws: a failed warm-up is not an error the user should see.
 */
export function warmUpBackend(): void {
  const now = Date.now();
  if (now - lastWarmUpAt < WARM_UP_THROTTLE_MS) return;
  lastWarmUpAt = now;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);

  fetch(`${API_ROOT}/health`, { method: 'GET', signal: controller.signal })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeout));
}
