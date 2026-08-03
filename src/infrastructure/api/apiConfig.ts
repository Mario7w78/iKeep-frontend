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
 * Fire-and-forget ping to wake the instance.
 *
 * Called when a screen that will need the backend opens. The user takes at
 * least a few seconds to type, and that is the window we use to boot the
 * server so their first real request does not eat the cold start.
 *
 * Never throws: a failed warm-up is not an error the user should see.
 */
export function warmUpBackend(): void {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS);

  fetch(`${API_ROOT}/health`, { method: 'GET', signal: controller.signal })
    .catch(() => undefined)
    .finally(() => clearTimeout(timeout));
}
